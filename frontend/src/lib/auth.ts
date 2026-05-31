import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

// Ensure users table exists for credentials auth
async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS justice_users (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name          TEXT,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'credentials',
      image         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(pool),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        mode: { label: "Mode", type: "text" }, // "login" | "signup"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await ensureUsersTable();

        const email = credentials.email.toLowerCase().trim();
        const { rows } = await pool.query(
          "SELECT * FROM justice_users WHERE email = $1",
          [email]
        );

        // ── SIGNUP ──────────────────────────────────────────────
        if (credentials.mode === "signup") {
          if (rows.length > 0) {
            throw new Error("Email already registered. Please sign in.");
          }
          const hash = await bcrypt.hash(credentials.password, 12);
          const { rows: newUser } = await pool.query(
            `INSERT INTO justice_users (name, email, password_hash, auth_provider)
             VALUES ($1, $2, $3, 'credentials')
             RETURNING id, name, email, image`,
            [credentials.name || email.split("@")[0], email, hash]
          );
          return newUser[0];
        }

        // ── LOGIN ────────────────────────────────────────────────
        if (rows.length === 0) {
          throw new Error("No account found. Please sign up first.");
        }
        const user = rows[0];
        if (!user.password_hash) {
          throw new Error("This email is registered with Google. Use Google sign-in.");
        }
        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) {
          throw new Error("Incorrect password.");
        }
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],

  // Use JWT for credentials, database for OAuth
  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth",
    error: "/auth",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.provider = account?.provider ?? "credentials";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always send to /app after sign-in
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return `${baseUrl}/app`;
    },
  },

  events: {
    // Store Google users in our justice_users table too
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await ensureUsersTable();
        await pool.query(
          `INSERT INTO justice_users (id, name, email, image, auth_provider)
           VALUES ($1, $2, $3, $4, 'google')
           ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name, image = EXCLUDED.image`,
          [user.id, user.name, user.email, user.image]
        );
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

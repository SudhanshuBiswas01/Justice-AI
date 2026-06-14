import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all routes under /dashboard, /chat, /voice, /ocr
export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/voice/:path*", "/ocr/:path*"],
};

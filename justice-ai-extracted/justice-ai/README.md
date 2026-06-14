# ⚖️ Justice AI — Frontend

An ultra-premium, AI-first legal intelligence frontend. Cinematic, fluid and built to feel like a Tier-1 global tech product (Apple · Stripe · Linear · Vercel · OpenAI · Arc · Perplexity).

> This repository is **frontend-only** by design — stunning UI, animations, layouts and reusable components. No backend, infra or optimization systems.

## ✨ Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** + custom design system
- **Framer Motion** (all animations & physics)
- **shadcn/ui** patterns (Button, Card, Input, Badge, Skeleton)
- **Radix UI** primitives (Dialog, Slot)
- **Lucide Icons**

## 🚀 Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> First run requires internet so Next.js can fetch the Google fonts (Inter, Sora, JetBrains Mono) and install dependencies.

## 🧭 Pages

| Route        | Page                | Highlights                                                                 |
| ------------ | ------------------- | -------------------------------------------------------------------------- |
| `/`          | Landing             | Parallax cinematic hero, floating glyphs, scroll-reveal features, showcase |
| `/auth`      | Authentication      | Split-screen, animated sign-in/up toggle, glass card, Google button        |
| `/dashboard` | Dashboard           | Animated sidebar, floating 3D cards, metrics, case cards, skeletons        |
| `/chat`      | Chat                | Streaming text, typing indicator, citation chips, floating composer        |
| `/voice`     | Nyay Voice AI       | Living voice orb, live waveform, cinematic listening/thinking/speaking     |
| `/ocr`       | Document Intelligence | Drag & drop, scanning beam animation, progress, AI summary                |

## 🧩 Reusable components

```
src/components
├── ui/               # shadcn-style primitives (button, card, input, badge, skeleton)
├── shared/           # Navbar, Sidebar, AppShell, FloatingCard, AnimatedButton,
│                     # Modal, Toast, SearchBar, CitationChip, SourceBadge,
│                     # CaseCard, AmbientBackground, PageTransition, Logo, SectionHeading
├── landing/          # Hero, Features, Stats, Showcase, CTA
├── chat/             # ChatBubble, TypingIndicator, StreamingText, ChatComposer
├── voice/            # VoiceOrb, Waveform
└── ocr/              # UploadZone, DocumentCard
```

## 🎨 Design system

- **Theme:** deep cinematic dark with indigo→violet→cyan brand gradient.
- **Glassmorphism:** `.glass`, `.glass-strong`, `.glass-card` utilities.
- **Ambient glows:** animated aurora blobs + grid (`AmbientBackground`).
- **Motion:** shared springs & easings in `src/lib/motion.ts`.
- **Hover physics:** cursor-tilt 3D cards (`FloatingCard`), magnetic buttons (`AnimatedButton`).
- **Micro-interactions:** layout-animated sidebar, animated toggles, shimmer skeletons, scroll-linked parallax.

## 📁 Structure

```
src/
├── app/
│   ├── layout.tsx        # fonts + ToastProvider
│   ├── globals.css       # design system / tailwind layers
│   ├── page.tsx          # landing
│   ├── auth/page.tsx
│   ├── dashboard/page.tsx
│   ├── chat/page.tsx
│   ├── voice/page.tsx
│   └── ocr/page.tsx
├── components/           # see above
└── lib/                  # utils, motion variants, mock data
```

Everything here is presentational with mock data so the experience can be explored end-to-end without a backend.

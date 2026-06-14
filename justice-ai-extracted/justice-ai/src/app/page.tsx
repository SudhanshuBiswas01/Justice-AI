import { Navbar } from "@/components/shared/navbar"
import { AmbientBackground } from "@/components/shared/ambient-background"
import { Hero } from "@/components/landing/hero"
import { Stats } from "@/components/landing/stats"
import { Features } from "@/components/landing/features"
import { Showcase } from "@/components/landing/showcase"
import { CTA } from "@/components/landing/cta"

export default function LandingPage() {
  return (
    <>
      <AmbientBackground />
      <Navbar />
      <main className="relative">
        <Hero />
        <Stats />
        <Features />
        <Showcase />
        <CTA />
      </main>
    </>
  )
}

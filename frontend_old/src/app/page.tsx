import { CategoryCards } from "@/components/CategoryCards";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <CategoryCards />
        <Features />
      </main>
      <Footer />
    </div>
  );
}

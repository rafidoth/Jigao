import {
  Header,
  Hero,
  LogosStrip,
  Features,
  HowItWorks,
  Pricing,
  FAQ,
  Footer,
} from "@/app/sections";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main>
        <Hero />
        <LogosStrip />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

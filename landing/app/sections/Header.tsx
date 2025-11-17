import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="group flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm">
            <span className="text-sm font-bold">J</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Jigao</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a className="text-muted-foreground hover:text-foreground" href="#features">Features</a>
          <a className="text-muted-foreground hover:text-foreground" href="#how">How it works</a>
          <a className="text-muted-foreground hover:text-foreground" href="#pricing">Pricing</a>
          <a className="text-muted-foreground hover:text-foreground" href="#faq">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden md:inline-flex" asChild>
            <a href="#pricing">Get started</a>
          </Button>
          <Button asChild>
            <a href="#how">Live demo</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

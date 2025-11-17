import { TerminalSquare, Network, SquareStack, Wand2 } from "lucide-react";

export default function LogosStrip() {
  return (
    <section className="border-b">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-6 py-8 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><TerminalSquare className="size-4" /> Go backend</span>
        <span className="inline-flex items-center gap-2"><Network className="size-4" /> WebSockets</span>
        <span className="inline-flex items-center gap-2"><SquareStack className="size-4" /> Postgres</span>
        <span className="inline-flex items-center gap-2"><Wand2 className="size-4" /> gRPC AI</span>
      </div>
    </section>
  );
}

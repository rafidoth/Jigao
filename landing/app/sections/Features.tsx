import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Layers3, Timer, Network, Users, ShieldCheck } from "lucide-react";

export default function Features() {
  const items = [
    {
      icon: Wand2,
      title: "Generate questions with AI",
      desc:
        "Give Jigao a topic and constraints. Our gRPC AI service suggests questions, choices, and answers you can refine.",
    },
    {
      icon: Layers3,
      title: "Organize by sets & context",
      desc:
        "Group questions into sets. Save optional context so future AI generations align with your syllabus or style.",
    },
    {
      icon: Timer,
      title: "Timed exams with schedules",
      desc:
        "Create exams from any set, set durations and start times, and let Jigao manage the countdowns.",
    },
    {
      icon: Network,
      title: "Real-time exam rooms",
      desc:
        "Rooms sync over WebSockets for instant updates: joins, starts, ends, and live status broadcasts.",
    },
    {
      icon: Users,
      title: "Roles & access control",
      desc:
        "Share sets with collaborators or participants. Owners stay in control while teams prepare together.",
    },
    {
      icon: ShieldCheck,
      title: "Built-in safeguards",
      desc:
        "Sensible CORS and security headers, structured logging, and parameterized queries with pgx.",
    },
  ] as const;

  return (
    <section id="features" className="border-b">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to run exams</h2>
          <p className="mt-3 text-muted-foreground">
            From drafting to delivery, Jigao streamlines the entire workflow.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.title}>
              <CardHeader>
                <div className="mb-2 inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <it.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{it.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{it.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

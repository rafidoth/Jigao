import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Button } from "@/components/ui/button";
import { PointerHighlight } from "@/components/ui/pointer-highlight";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b h-screen">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-24 text-center md:gap-10">
        <div className="inline-flex items-center gap-2 rounded-full border bg-accent px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
          <strong>AI POWERED</strong>
        </div>

        <h1 className="font-serif max-w-5xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60">
          Exams Built for
          <PointerHighlight
            rectangleClassName="dark:bg-neutral-700 border-2 border-blue-700 dark:border-neutral-600"
            pointerClassName="text-blue-700"
          >
            <span className="m-2 text-primary">Every Scenerio.</span>
          </PointerHighlight>
        </h1>

        <TextLoopCustomVariantsTransition />

        <p className="font-sans max-w-2xl text-pretty text-2xl ">
          Self-tests, selected people, or public assessments all from one
          platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant={"default"} size="lg" className="px-6" asChild>
            <a href="#pricing">Start free</a>
          </Button>
          <Button size="lg" variant="outline" className="px-6" asChild>
            <a href="#how">See how it works</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function TextLoopCustomVariantsTransition() {
  return (
    <div className="flex items-center whitespace-pre-wrap text-xl font-semibold font-sans">
      Are You{" "}
      <TextLoop
        className="overflow-y-clip text-primary-foreground bg-primary px-2 rounded-md mx-2"
        transition={{
          type: "spring",
          stiffness: 900,
          damping: 80,
          mass: 10,
        }}
        variants={{
          initial: {
            y: 20,
            rotateX: 90,
            opacity: 0,
            filter: "blur(4px)",
          },
          animate: {
            y: 0,
            rotateX: 0,
            opacity: 1,
            filter: "blur(0px)",
          },
          exit: {
            y: -20,
            rotateX: -90,
            opacity: 0,
            filter: "blur(4px)",
          },
        }}
      >
        <span>Self-learner</span>
        <span>Student</span>
        <span>Educator</span>
        <span>Professional</span>
        <span>Company</span>
      </TextLoop>
      ?
    </div>
  );
}

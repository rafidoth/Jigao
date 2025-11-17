import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <section id="faq" className="border-b">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <p className="mt-3 text-muted-foreground">Answers to common questions about Jigao.</p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger>What is Jigao?</AccordionTrigger>
              <AccordionContent>
                Jigao is a platform to create question sets and run timed exams with real-time rooms. It optionally uses an AI service over gRPC to draft questions.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>How does AI generation work?</AccordionTrigger>
              <AccordionContent>
                The backend calls a Node/TypeScript AI service via gRPC. You provide a topic/context; the service suggests questions, choices, and answers for review.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Do I need to use the AI service?</AccordionTrigger>
              <AccordionContent>
                No. You can add and edit questions manually at any time. AI is an optional accelerator.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>Is my data secure?</AccordionTrigger>
              <AccordionContent>
                The app enforces sensible defaults like CORS controls, security headers, and parameterized queries using pgx. Always deploy with best practices for your environment.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}

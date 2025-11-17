import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HowItWorks() {
  return (
    <section id="how" className="border-b">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Four simple steps from idea to proctored session.</p>
        </div>
        <Tabs defaultValue="create" className="mt-10">
          <TabsList className="mx-auto grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="create">Create set</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="proctor">Proctor</TabsTrigger>
          </TabsList>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <TabsContent value="create" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>1. Create a question set</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Define a title and optional context so AI generations follow your syllabus and tone. Add collaborators as needed.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="generate" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>2. Generate questions with AI</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Ask Jigao to draft questions. Review suggestions for question, choices, and answer keys. Edit or add your own.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="schedule" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>3. Schedule a timed exam</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Turn any set into an exam with duration and start time. Jigao handles countdowns and room timelines.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="proctor" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>4. Run and proctor live</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Participants join browser rooms over WebSockets. Broadcast starts and ends instantly. Track status in real time.
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
}

import { CountdownText } from "./ExamPage";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

function ExamPageWaitingUI({
  startTime,
  title,
}: {
  startTime: Date;
  title: string;
}) {
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold m-3">{title}</h1>
      <Card className="w-2/4">
        <CardContent className="flex flex-col">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">Waiting for exam to start</p>
              <div className="border flex gap-x-2 px-2 rounded-md bg-blue-800/20 text-blue-500 font-semibold">
                <span>{format(startTime, "d MMMM,yyyy")}</span>
                <span>{format(startTime, "p")}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 py-2">
              <div className="text-xs text-muted-foreground">Starts in</div>
              <div className="font-mono text-2xl">
                <CountdownText until={startTime} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExamPageWaitingUI;

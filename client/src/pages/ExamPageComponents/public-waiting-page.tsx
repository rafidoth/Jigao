import { format } from "date-fns";
import { Globe } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { CountdownText } from "./countdown-text";

type PublicWaitingPageProps = {
  startTime: Date;
  title: string;
};

function PublicWaitingPage({ startTime, title }: PublicWaitingPageProps) {
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center gap-4">
      <h1 className="text-2xl font-bold m-3">{title}</h1>
      <div className="w-full max-w-2xl rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-sm text-sky-700 flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Public exam lobby is open. Keep this tab active until the session starts.
      </div>
      <Card className="w-2/4">
        <CardContent className="flex flex-col">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">Public exam lobby</p>
              <div className="border flex gap-x-2 px-2 rounded-md bg-blue-800/20 text-blue-500 font-semibold">
                <span>{format(startTime, "d MMMM,yyyy")}</span>
                <span>{format(startTime, "p")}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 py-2">
              <div className="text-xs text-muted-foreground">Starts in</div>
              <div className="font-mono text-lg">
                <CountdownText until={startTime} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PublicWaitingPage;

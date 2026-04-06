import { format } from "date-fns";
import { ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { CountdownText } from "./countdown-text";

type ProtectedWaitingPageProps = {
  startTime: Date;
  title: string;
};

function ProtectedWaitingPage({ startTime, title }: ProtectedWaitingPageProps) {
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center gap-4">
      <h1 className="text-2xl font-bold m-3">{title}</h1>
      <div className="w-full max-w-2xl rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        Protected exam lobby is active. Please remain connected for monitoring.
      </div>
      <Card className="w-2/4">
        <CardContent className="flex flex-col">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">Protected exam lobby</p>
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

export default ProtectedWaitingPage;

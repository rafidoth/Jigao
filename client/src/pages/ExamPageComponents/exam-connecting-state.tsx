import { LoaderIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ExamConnectingState() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Connecting to exam room</CardTitle>
        <CardDescription>Please wait while we establish a secure connection.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderIcon className="animate-spin" />
          Preparing your exam session...
        </div>
      </CardContent>
    </Card>
  );
}

export default ExamConnectingState;

import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function ExamLoadErrorAlert() {
  return (
    <div className="w-full max-w-3xl">
      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>Unable to load exam</AlertTitle>
        <AlertDescription>Please refresh and try again.</AlertDescription>
      </Alert>
    </div>
  );
}

export default ExamLoadErrorAlert;

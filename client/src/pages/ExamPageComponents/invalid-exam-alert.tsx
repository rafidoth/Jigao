import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function InvalidExamAlert() {
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>Invalid exam</AlertTitle>
        <AlertDescription>Exam id is missing from URL.</AlertDescription>
      </Alert>
    </div>
  );
}

export default InvalidExamAlert;

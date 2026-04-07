import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useEndTime, useExamId, useExamTitle } from "../store/examStore";

/**
 * Displayed when exam has ended (either submitted or time expired).
 */
function ExamEnded() {
  const title = useExamTitle();
  const endTime = useEndTime();
  const examId = useExamId();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Exam Completed
        </CardTitle>
        <CardDescription>
          {title || "Exam"} has ended
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {endTime && (
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Ended at</p>
            <p className="text-sm font-medium">
              {format(endTime, "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Your answers have been submitted. You may close this window.
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/exams">Back to Exams</Link>
        </Button>
        {examId && (
          <Button asChild>
            <Link to={`/submissions/${examId}`}>View Submission</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ExamEnded;

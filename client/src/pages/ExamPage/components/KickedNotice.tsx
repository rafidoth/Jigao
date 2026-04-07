import { XCircle } from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { useKickReason, useExamTitle } from "../store/examStore";

/**
 * Displayed when participant has been kicked from the exam.
 */
function KickedNotice() {
  const kickReason = useKickReason();
  const title = useExamTitle();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          Removed from Exam
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTitle>You have been removed from "{title || "this exam"}"</AlertTitle>
          <AlertDescription>
            {kickReason || "A proctor has removed you from this exam session."}
          </AlertDescription>
        </Alert>
        <p className="mt-4 text-sm text-muted-foreground">
          If you believe this was a mistake, please contact your exam administrator.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild>
          <Link to="/exams">Back to Exams</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default KickedNotice;

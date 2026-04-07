import { AlertCircle } from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { useErrorMessage } from "../store/examStore";

/**
 * Displayed when an unrecoverable error occurs.
 */
function ExamError() {
  const errorMessage = useErrorMessage();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Unable to Load Exam
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {errorMessage || "An unexpected error occurred. Please try again."}
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild>
          <Link to="/exams">Back to Exams</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ExamError;

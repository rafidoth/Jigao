import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getExamById,
  getQuestionsByExamId,
  getSubmissionByExamId,
} from "@/api/query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, LoaderIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types/questions";
import QuestionCard from "@/components/question-cards/QuestionCard";

type AnswerEntry = {
  answer: string | number | boolean | null;
  is_correct: boolean;
  correct_answer: string;
};

type SubmissionResponse = {
  success: boolean;
  message?: string;
  data?: {
    score: number;
    answer_sheet: Record<string | number, AnswerEntry>;
    created_at: Date;
  };
};

function useSubmission(examId: string | undefined) {
  return useQuery<SubmissionResponse>({
    queryKey: ["submission", examId],
    enabled: !!examId,
    queryFn: async () => (await getSubmissionByExamId(examId)) as SubmissionResponse,
    staleTime: 60_000,
    retry: 1,
  });
}

function useQuestions(examId: string | undefined) {
  return useQuery({
    queryKey: ["questions", examId],
    enabled: !!examId,
    queryFn: () => getQuestionsByExamId(examId!),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

function useExams(examId: string | undefined) {
  return useQuery({
    queryKey: ["exams", examId],
    enabled: !!examId,
    queryFn: () => getExamById(examId!),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

function CorrectedQuestionsList({
  questions,
  userSubmission,
}: {
  questions: Question[];
  userSubmission: Record<string, AnswerEntry>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {questions.map((q, idx) => (
        <QuestionCard
          mode="result"
          key={q.question_id}
          question={q}
          position={idx + 1}
          answer={userSubmission[q.question_id]}
        />
      ))}
    </div>
  );
}

function Submission() {
  const { exam_id } = useParams();
  const {
    data: submissionData,
    isLoading: submissionDataLoading,
    isError: errorFetchingSubmissionData,
    error,
  } = useSubmission(exam_id);
  const {
    data: questionsData,
    isLoading: questionsDataLoading,
    isError: errorFetchingQuestionData,
  } = useQuestions(exam_id);

  const { data: examData, isLoading: examDataLoading } = useExams(exam_id);

  if (errorFetchingQuestionData || errorFetchingSubmissionData) {
    console.error("Error fetching submission data:", error);
    return (
      <div className="w-full h-full flex justify-center items-center text-2xl text-muted-foreground font-bold">
        No Submission Found for this exam.
      </div>
    );
  }

  if (submissionDataLoading || questionsDataLoading || examDataLoading) {
    return (
      <div className="flex justify-center items-center h-[100vh] gap-x-2">
        <span className="text-base font-medium animate-spin flex items-center gap-2">
          <LoaderIcon />
        </span>
        Loading
      </div>
    );
  }

  if (submissionData && submissionData.success === false) {
    return (
      <Alert className="m-4">
        <AlertTitle>Exam not evaluated yet</AlertTitle>
        <AlertDescription>
          Exam is not evaluated yet, please have patience.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-[100vh] w-full px-6 select-none">
      <Button
        className="absolute top-6 left-6 cursor-pointer hover:otransition-colors rounded-full p-2 w-10 h-10 flex justify-center items-center"
        variant="outline"
        onClick={() => window.history.back()}
      >
        <ArrowLeft />
      </Button>

      <div className="flex flex-col font-bold justify-center items-center py-4 gap-2">
        <div className="text-sm">{examData?.title}</div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-2 bg-primary/10 rounded-xl px-4 py-2">
            <span>Score</span>
            <Badge className="bg-accent font-bold">
              <span>{submissionData?.data?.score}</span>
              <span> / {questionsData?.length}</span>
            </Badge>
          </div>
          <div className="flex flex-col items-center gap-2 bg-primary/10 rounded-xl px-4 py-2">
            <span>Duration</span>
            <Badge className="bg-accent font-bold">
              <span> {examData?.duration}</span>
            </Badge>
          </div>
          {submissionData?.data?.created_at && (
            <div className="flex flex-col items-center gap-2 bg-primary/10 rounded-xl px-4 py-2">
              <span>Submission Time</span>
              <div className="flex gap-2">
                <Badge className="bg-accent font-bold">
                  <span>{format(submissionData.data.created_at, "dd MMMM, yyyy")}</span>
                </Badge>
                <Badge className="bg-accent font-bold">
                  <span>{format(submissionData.data.created_at, "hh:mm a")}</span>
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:w-3/4 w-full mx-auto">
        {questionsData && submissionData?.data?.answer_sheet && (
          <CorrectedQuestionsList
            questions={questionsData as Question[]}
            userSubmission={
              submissionData.data.answer_sheet as Record<string, AnswerEntry>
            }
          />
        )}
      </div>
    </ScrollArea>
  );
}

export default Submission;

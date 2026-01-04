import { useParams } from "react-router";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getExamById, getQuestionsByExamId } from "@/api/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoaderIcon } from "lucide-react";
import { format } from "date-fns";

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

type QuestionType = {
  id: string;
  text: string;
  type:
    | "multiple_choice_questions"
    | "true_false"
    | "fill_in_the_blanks"
    | "short_question";
  difficulty: "easy" | "medium" | "hard";
  choices: string[];
  answer: string;
  answerIdx: number;
  explanation: string;
};

function useSubmission(examId: string | undefined) {
  return useQuery<SubmissionResponse>({
    queryKey: ["submission", examId],
    enabled: !!examId,
    queryFn: async () => {
      const res = await axios.get(`/api/v1/submissions/${examId}`);
      return res.data as SubmissionResponse;
    },
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
  user_submission,
}: {
  questions: QuestionType[];
  user_submission: Record<string, AnswerEntry>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {questions.map((q) => {
        const entry = user_submission[q.id];
        const isCorrect = entry?.is_correct === true;
        // const unanswered = entry?.answer === null || entry?.answer === "";
        const userAns = entry?.answer;
        const {
          id: questionId,
          text: questionText,
          choices,
          difficulty,
          answer: correctAnswer,
          explanation,
        } = q;

        return (
          <div
            key={questionId}
            className={`rounded-xl border-none p-4 transition-colors ${
              isCorrect ? "bg-green-950/30" : " bg-red-950/30"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {difficulty}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isCorrect ? "text-green-400" : "text-red-400"
                }`}
              >
                {isCorrect ? "Correct" : "Incorrect"}
              </span>
            </div>

            <p className="font-medium text-foreground mb-3">{questionText}</p>

            <div className="space-y-2">
              {choices?.map((choice, idx) => {
                const isUserAnswer = userAns === choice;
                const isCorrectAnswer = correctAnswer === choice;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-md border transition-colors ${
                      isCorrectAnswer
                        ? "bg-green-950/30 border-green-700/50 text-green-200"
                        : isUserAnswer
                          ? "bg-red-950/30 border-red-700/50 text-red-200"
                          : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm">{choice}</span>
                    {isCorrectAnswer && (
                      <span className="ml-2 text-xs font-semibold text-green-300">
                        ✓ Correct
                      </span>
                    )}
                    {isUserAnswer && !isCorrect && (
                      <span className="ml-2 text-xs font-semibold text-red-300">
                        Your answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {explanation && (
              <div className="mt-4 p-3 bg-secondary/10 rounded-md">
                <span className="font-semibold">Explanation:</span>
                <p className="text-sm mt-1">{explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Submission() {
  const { exam_id } = useParams();
  const {
    data: submissionData,
    isLoading: submissionDataLoading,
    isError,
    error,
  } = useSubmission(exam_id);
  const { data: questionsData, isLoading: questionsDataLoading } =
    useQuestions(exam_id);

  const { data: examData, isLoading: examDataLoading } = useExams(exam_id);
  const entries = useMemo(() => {
    if (!submissionData?.data?.answer_sheet) return [];
    return Object.entries(submissionData.data.answer_sheet);
  }, [submissionData]);

  console.log("entries", entries);

  if (isError) {
    console.error("Error fetching submission data:", error);
  }
  if (submissionDataLoading || questionsDataLoading || examDataLoading) {
    return (
      <div className="flex justify-center items-center h-[100vh] gap-x-2">
        <span className="text-lg font-medium animate-spin flex items-center gap-2">
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
      <div className="flex flex-col font-bold justify-center items-center py-4 gap-2">
        <div className="text-2xl">{examData?.title}</div>
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
              <span> {examData.duration}</span>
            </Badge>
          </div>
          {submissionData?.data?.created_at && (
            <div className="flex flex-col items-center gap-2 bg-primary/10 rounded-xl px-4 py-2">
              <span>Subimission Time</span>
              <div className="flex gap-2">
                <Badge className="bg-accent font-bold">
                  <span>
                    {" "}
                    {format(submissionData.data.created_at, "dd MMMM, yyyy")}
                  </span>
                </Badge>
                <Badge className="bg-accent font-bold">
                  <span>
                    {" "}
                    {format(submissionData.data.created_at, "hh:mm a")}
                  </span>
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="lg:w-3/4 w-full mx-auto">
        {questionsData && submissionData?.data?.answer_sheet && (
          <CorrectedQuestionsList
            questions={questionsData as QuestionType[]}
            user_submission={
              submissionData.data.answer_sheet as Record<string, AnswerEntry>
            }
          />
        )}
      </div>
    </ScrollArea>
  );
}

export default Submission;

import { useParams } from "react-router";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getQuestionsByExamId } from "@/api/api";
import { ScrollArea } from "@/components/ui/scroll-area";
const dummy = [
  {
    id: "2d3bfc69-f13f-4e28-8796-d64a6d3184e2",
    text: "What is the primary purpose of an Environmental Impact Assessment (EIA)?",
    type: "multiple_choice_questions",
    difficulty: "easy",
    choices: [
      "To assess economic feasibility",
      "To evaluate potential environmental effects of a proposed project",
      "To design marketing strategies",
      "To calculate project profit",
    ],
    answer: "To evaluate potential environmental effects of a proposed project",
    answerIdx: 1,
    explanation:
      "The main goal of an EIA is to identify, predict, and evaluate the environmental consequences of a proposed action before decisions are made.",
  },
  {
    id: "daadbf28-2645-476e-9b2e-799769d676f8",
    text: "The ___ method involves comparing the environmental conditions before and after a project implementation.",
    type: "fill_in_the_blanks",
    difficulty: "medium",
    choices: ["Before-After", "Control-Impact", "Difference-in-Differences"],
    answer: "",
    answerIdx: 0,
    explanation: "",
  },
  {
    id: "2867df10-40a9-4fb9-967b-d4b14abb1869",
    text: "An EIA is only required for large-scale industrial projects.",
    type: "true_false",
    difficulty: "easy",
    choices: ["true", "false"],
    answer: "false",
    answerIdx: 1,
    explanation:
      "EIAs can be required for a wide range of projects, not just large industrial ones, depending on potential environmental impacts.",
  },
  {
    id: "68bdab5f-52af-4eb4-817d-62fc23de9b7e",
    text: "Name one key component that must be included in an EIA report.",
    type: "short_question",
    difficulty: "medium",
    choices: [],
    answer: "Mitigation measures",
    answerIdx: 0,
    explanation:
      "An EIA report must outline mitigation measures to reduce or offset identified adverse impacts.",
  },
];

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

// function useExams(examId: string | undefined) {
//   return useQuery({
//     queryKey: ["exams", examId],
//     enabled: !!examId,
//     queryFn:
//       const res = await axios.get(`/api/v1/exams/${examId}`);
//       return res.data;
//     },
//     staleTime: 5 * 60_000,
//     retry: 1,
//   });
// }

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
        const userAns = entry?.answer;
        console.log("question", q.text, entry?.is_correct);
        const {
          id: questionId,
          text: questionText,
          choices,
          type,
          difficulty,
          answer: correctAnswer,
        } = q;

        return (
          <div
            key={questionId}
            className={`rounded-xl border p-4 transition-colors ${
              isCorrect
                ? "border-green-600/60 bg-green-950/20"
                : "border-red-600/60 bg-red-950/20"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {difficulty}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isCorrect ? "text-green-400" : "text-red-400"
                }`}
              >
                {isCorrect ? "✓ Correct" : "✗ Incorrect"}
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
          </div>
        );
      })}
    </div>
  );
}

function Submission() {
  const { exam_id } = useParams();
  const { data: submissionData, isError, error } = useSubmission(exam_id);
  const { data: questionsData } = useQuestions(exam_id);
  console.log("questions data fetched", questionsData);
  console.log("submission data fetched", submissionData);
  console.log("answer sheet", submissionData?.data?.answer_sheet);
  const entries = useMemo(() => {
    if (!submissionData?.data?.answer_sheet) return [];
    return Object.entries(submissionData.data.answer_sheet);
  }, [submissionData]);
  console.log("entries", entries);

  if (isError) {
    console.error("Error fetching submission data:", error);
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
    <ScrollArea className="h-[100vh] w-full px-6">
      <div className="flex justify-center justify-center py-4">
        <Badge className="bg-primary font-bold">
          <span>{submissionData?.data?.score}</span>
          <span> / {questionsData?.length}</span>
        </Badge>
        <span></span>
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

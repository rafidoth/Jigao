import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getQuestionsByExamId } from "@/api/query";

import type { ExamStatus } from "./types";

export function useExamQuestions(examId: string | undefined, examStatus: ExamStatus) {
  const { data: questions } = useQuery({
    queryKey: ["exam", examId, "questions"],
    queryFn: () => getQuestionsByExamId(examId),
    enabled: examStatus === "running",
    staleTime: 60_000,
  });

  return useMemo(() => questions || [], [questions]);
}

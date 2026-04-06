import { useQuery } from "@tanstack/react-query";

import { getExamById } from "@/api/query";

import type { ExamDetails } from "./types";

export function useExamDetails(examId?: string) {
  return useQuery<ExamDetails>({
    queryKey: ["exam", examId],
    queryFn: () => getExamById(examId),
    enabled: !!examId,
    staleTime: 60_000,
  });
}

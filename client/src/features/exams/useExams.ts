import { useQuery } from "@tanstack/react-query";
import { getExams } from "./api";
import type { Exam } from "./types";

export function useExams() {
  const query = useQuery<Exam[]>({
    queryKey: ["exams"],
    queryFn: () => getExams(),
    staleTime: 30_000,
    retry: 1,
  });
  return query;
}

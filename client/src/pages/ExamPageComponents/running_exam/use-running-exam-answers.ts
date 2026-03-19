import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/types/questions";

export function useRunningExamAnswers(questions: Question[], examId?: string) {
  const localStorageKey = useMemo(() => `exam-answers-${examId}`, [examId]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const savedAnswers = localStorage.getItem(localStorageKey);

    if (savedAnswers) {
      setSelectedAnswers(JSON.parse(savedAnswers));
      return;
    }

    const initial = questions.reduce<Record<string, string | null>>((acc, q) => {
      acc[q.question_id] = null;
      return acc;
    }, {});

    setSelectedAnswers(initial);
  }, [questions, localStorageKey]);

  const selectAnswer = (id: string, answer: string) => {
    setSelectedAnswers((prev) => {
      const next = { ...prev, [id]: answer };
      localStorage.setItem(localStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const clearAnswers = () => {
    localStorage.removeItem(localStorageKey);
  };

  return {
    selectedAnswers,
    selectAnswer,
    clearAnswers,
  };
}

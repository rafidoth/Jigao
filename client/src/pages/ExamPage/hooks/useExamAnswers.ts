import { useCallback, useEffect, useRef } from "react";

import { ANSWER_SYNC_DEBOUNCE_MS, MSG_ANSWER_UPDATE, MSG_SUBMIT_EXAM } from "../constants";
import { useExamStore, useSendSocketMessage } from "../store/examStore";

/**
 * Hook for managing exam answers with debounced sync to server.
 * 
 * Features:
 * - Immediate local state update
 * - Debounced WebSocket sync (500ms after last change)
 * - localStorage persistence as backup
 * - Pending sync tracking
 */
export function useExamAnswers() {
  const isConnected = useExamStore((s) => s.isConnected);
  const send = useSendSocketMessage();

  // Get state from store
  const examId = useExamStore((s) => s.examId);
  const answers = useExamStore((s) => s.answers);
  const pendingSyncs = useExamStore((s) => s.pendingSyncs);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const setSubmitted = useExamStore((s) => s.setSubmitted);

  // Debounce timers for each question
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, []);

  /**
   * Select an answer for a question.
   * Updates local state immediately and syncs to server with debounce.
   */
  const selectAnswer = useCallback(
    (questionId: string, answer: string) => {
      // Update local state immediately (this also persists to localStorage)
      setAnswer(questionId, answer);

      // Cancel any pending sync for this question
      const existingTimer = debounceTimers.current.get(questionId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Schedule sync after debounce period
      const timer = setTimeout(() => {
        if (isConnected) {
          send(MSG_ANSWER_UPDATE, {
            question_id: questionId,
            answer,
          });
        }
        debounceTimers.current.delete(questionId);
      }, ANSWER_SYNC_DEBOUNCE_MS);

      debounceTimers.current.set(questionId, timer);
    },
    [setAnswer, send, isConnected],
  );

  /**
   * Submit the exam.
   * Sends all answers to server and transitions to ended state.
   */
  const submitExam = useCallback(() => {
    if (!examId) {
      console.error("Cannot submit: no exam ID");
      return false;
    }

    if (!isConnected) {
      console.error("Cannot submit: not connected to server");
      return false;
    }

    // Clear any pending debounced syncs
    debounceTimers.current.forEach((timer) => clearTimeout(timer));
    debounceTimers.current.clear();

    // Send submit message
    send(MSG_SUBMIT_EXAM, {
      exam_id: examId,
      answers,
    });

    // Optimistically transition to ended state
    // Server will confirm via submit-accepted message
    setSubmitted();

    return true;
  }, [examId, isConnected, answers, send, setSubmitted]);

  /**
   * Get the answer for a specific question.
   */
  const getAnswer = useCallback(
    (questionId: string): string | undefined => {
      return answers[questionId];
    },
    [answers],
  );

  /**
   * Check if a question has a pending sync.
   */
  const isPending = useCallback(
    (questionId: string): boolean => {
      return pendingSyncs.has(questionId);
    },
    [pendingSyncs],
  );

  /**
   * Get count of answered questions.
   */
  const answeredCount = Object.values(answers).filter(
    (a) => a !== null && a !== undefined && a !== "",
  ).length;

  return {
    answers,
    selectAnswer,
    submitExam,
    getAnswer,
    isPending,
    answeredCount,
    pendingSyncs,
    isConnected,
  };
}

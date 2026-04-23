import { useCallback, useEffect, useRef } from "react";

import { ANSWER_SYNC_DEBOUNCE_MS, MSG_ANSWER_UPDATE, MSG_SUBMIT_EXAM } from "../constants";
import { useExamStore, useSendSocketMessage } from "../store/examStore";

export function useExamAnswers() {
    const isConnected = useExamStore((s) => s.isConnected);
    const send = useSendSocketMessage();

    // Get state from store
    const examId = useExamStore((s) => s.examId);
    const answers = useExamStore((s) => s.answers);
    const pendingSyncs = useExamStore((s) => s.pendingSyncs);
    const setAnswer = useExamStore((s) => s.setAnswer);
    const setSubmitted = useExamStore((s) => s.setSubmitted);

    const queuedAnswers = useRef<Record<string, string>>({});
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearDebounceTimer = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
    }, []);

    const flushPending = useCallback((): boolean => {
        const delta = { ...queuedAnswers.current };
        if (Object.keys(delta).length === 0) {
            return true;
        }

        if (!useExamStore.getState().isConnected) {
            return false;
        }

        send(MSG_ANSWER_UPDATE, { answers: delta });
        queuedAnswers.current = {};
        return true;
    }, [send]);

    const scheduleFlush = useCallback(() => {
        clearDebounceTimer();
        debounceTimer.current = setTimeout(() => {
            flushPending();
            debounceTimer.current = null;
        }, ANSWER_SYNC_DEBOUNCE_MS);
    }, [clearDebounceTimer, flushPending]);

    useEffect(() => {
        return () => {
            clearDebounceTimer();
        };
    }, [clearDebounceTimer]);

    useEffect(() => {
        if (isConnected && Object.keys(queuedAnswers.current).length > 0) {
            flushPending();
        }
    }, [isConnected, flushPending]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            clearDebounceTimer();
            flushPending();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [clearDebounceTimer, flushPending]);

    const selectAnswer = useCallback(
        (questionId: string, answer: string) => {
            setAnswer(questionId, answer);
            queuedAnswers.current[questionId] = answer;
            scheduleFlush();
        },
        [setAnswer, scheduleFlush],
    );

    const submitExam = useCallback(() => {
        if (!examId) {
            console.error("Cannot submit: no exam ID");
            return false;
        }

        if (!isConnected) {
            console.error("Cannot submit: not connected to server");
            return false;
        }

        clearDebounceTimer();
        if (!flushPending()) {
            console.error("Cannot submit: failed to flush pending answer updates");
            return false;
        }

        send(MSG_SUBMIT_EXAM, {
            exam_id: examId,
            answers,
        });

        setSubmitted();

        return true;
    }, [examId, isConnected, answers, send, setSubmitted, clearDebounceTimer, flushPending]);

    const getAnswer = useCallback(
        (questionId: string): string | undefined => {
            return answers[questionId];
        },
        [answers],
    );

    const isPending = useCallback(
        (questionId: string): boolean => {
            return pendingSyncs.has(questionId);
        },
        [pendingSyncs],
    );

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

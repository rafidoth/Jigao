import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useMutation, useQueries } from "@tanstack/react-query";
import { differenceInSeconds } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitSelfTestApiPost } from "@/api/mutation";
import { getSet, getQuestions } from "@/api/query";
import { SelfTestQuestionCard } from "@/components/self_test/question-cards";
import useSelfTestAnswersStore from "@/store/selfTestAnswersStore";
import useSelfTestTimerStore from "@/store/selfTestTimerStore";
import { Info } from "lucide-react";
import type { Question } from "@/types/questions";

function formatDuration(seconds: number) {
    if (seconds <= 0) return "00:00";
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function useRemainingSeconds(endTime: number | null) {
    const [remainingSeconds, setRemainingSeconds] = useState(() => {
        if (!endTime) return 0;
        return Math.max(0, differenceInSeconds(endTime, Date.now()));
    });

    useEffect(() => {
        if (!endTime) return;

        const interval = setInterval(() => {
            const secondsLeft = differenceInSeconds(endTime, Date.now());
            setRemainingSeconds(Math.max(0, secondsLeft));
            if (secondsLeft <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    return remainingSeconds;
}

function LoadingSelfTest() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    );
}

function ErrorSelfTest({ message }: { message?: string }) {
    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Error loading self test{message ? `: ${message}` : ""}
                </AlertDescription>
            </Alert>
        </div>
    );
}

function SelfTestPreview({
    set,
    questionCountLabel,
    durationInMinutes,
    onStart,
}: {
    set: { title: string };
    questionCountLabel: string;
    durationInMinutes: number;
    onStart: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-2xl font-bold">{set.title}</h1>
                    <p className="text-muted-foreground text-sm">Self Test</p>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <Badge variant="secondary">{durationInMinutes} minutes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Questions</span>
                        <Badge variant="secondary">{questionCountLabel}</Badge>
                    </div>
                </div>

                <div className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
                    <p>Timer will start when you click Start</p>
                    <p>Your progress will be saved locally</p>
                </div>

                <Button onClick={onStart} className="w-full">
                    Start Test
                </Button>
            </Card>
        </div>
    );
}

function SelfTestActive({
    set,
    questions,
    endTime,
    onSubmit,
    isSubmitting,
}: {
    set: { title: string };
    questions: Question[];
    endTime: number;
    onSubmit: () => void;
    isSubmitting: boolean;
}) {
    const remainingSeconds = useRemainingSeconds(endTime);
    const { answers, selectAnswer } = useSelfTestAnswersStore();

    const handleSubmit = useCallback(() => {
        onSubmit();
    }, [onSubmit]);

    useEffect(() => {
        if (remainingSeconds <= 0 && !isSubmitting) {
            handleSubmit();
        }
    }, [remainingSeconds, handleSubmit, isSubmitting]);

    const isTimeWarning = remainingSeconds <= 60 && remainingSeconds > 0;

    return (
        <div className="min-h-screen flex flex-col">
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex justify-between items-center px-4 py-3 max-w-3xl mx-auto w-full">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{set.title}</span>
                        <Badge
                            variant="outline"
                            className={`w-fit text-xs ${isTimeWarning
                                ? "bg-red-500/20 text-red-500 border-red-500"
                                : "bg-blue-500/20 text-blue-500"
                                }`}
                        >
                            {isTimeWarning ? "Time almost up!" : "Self Test in progress"}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4">
                        <div
                            className={`font-mono text-xl font-bold ${isTimeWarning ? "text-red-500" : "text-foreground"
                                }`}
                        >
                            {formatDuration(remainingSeconds)}
                        </div>
                        <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
                            Submit
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 py-6">
                <div className="flex flex-col items-center gap-3 max-w-3xl mx-auto w-full px-4">
                    {questions.map((q, idx) => (
                        <div key={q.question_id} className="w-full">
                            <SelfTestQuestionCard
                                question={q}
                                position={idx + 1}
                                selected={answers[q.question_id] || {}}
                                selectAnswer={selectAnswer}
                            />
                        </div>
                    ))}

                    <div className="flex justify-center py-4">
                        <Badge className="bg-blue-600/20 text-blue-500">End of Questions</Badge>
                    </div>

                    <div className="w-full pt-4 pb-8">
                        <Button variant="destructive" className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Test"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SelfTest() {
    const [searchParams] = useSearchParams();
    const setId = searchParams.get("setId");
    const rawDuration = Number.parseInt(searchParams.get("durationInMinutes") || "30", 10);
    const durationInMinutes = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 30;
    const navigate = useNavigate();

    const [startedByUser, setStartedByUser] = useState(false);
    const { hydrateTimer, startTimer, clearTimer, endTime, startedAt } = useSelfTestTimerStore();
    const { hydrateAnswers, clearAnswers } = useSelfTestAnswersStore();
    const submitMutation = useMutation({ mutationFn: submitSelfTestApiPost });

    useEffect(() => {
        if (!setId) return;
        hydrateTimer(setId);
        hydrateAnswers(setId);
    }, [setId, hydrateTimer, hydrateAnswers]);

    const hasResumableAttempt = useMemo(
        () => !!setId && !!endTime && endTime > Date.now(),
        [setId, endTime],
    );
    const shouldLoadQuestions = startedByUser || hasResumableAttempt;

    const results = useQueries({
        queries: [
            {
                queryKey: ["self-test-set", setId],
                queryFn: () => getSet(setId as string),
                staleTime: 5 * 60 * 1000,
                enabled: !!setId,
            },
            {
                queryKey: ["self-test-questions", setId],
                queryFn: () => getQuestions(setId as string),
                staleTime: 5 * 60 * 1000,
                enabled: !!setId && shouldLoadQuestions,
            },
        ],
    });

    const { data: set, isLoading: isSetLoading, isError: isSetError, error: setError } = results[0];
    const { data: questions, isLoading: isQuestionsLoading, isError: isQuestionsError, error: questionsError } = results[1];

    const questionCountLabel = useMemo(() => {
        if (typeof set?.question_count === "number") {
            return String(set.question_count);
        }
        if (typeof set?.questions_count === "number") {
            return String(set.questions_count);
        }
        if (Array.isArray(questions)) {
            return String(questions.length);
        }
        return "Will load on start";
    }, [set, questions]);

    const handleStart = useCallback(() => {
        if (!setId) return;
        startTimer(setId, durationInMinutes);
        setStartedByUser(true);
    }, [setId, durationInMinutes, startTimer]);

    const handleSubmit = useCallback(() => {
        if (!setId) return;
        if (submitMutation.isPending) return;
        const answers = useSelfTestAnswersStore.getState().answers;
        const effectiveStartedAt = startedAt ?? Date.now();
        submitMutation.mutate(
            {
                set_id: setId,
                duration_in_minutes: durationInMinutes,
                time_taken_seconds: Math.max(0, Math.floor((Date.now() - effectiveStartedAt) / 1000)),
                answers,
            },
            {
                onSuccess: (response) => {
                    clearTimer();
                    clearAnswers();
                    navigate(`/selftest/${response.data.self_test_id}`);
                },
            },
        );
    }, [setId, durationInMinutes, startedAt, submitMutation, clearTimer, clearAnswers, navigate]);

    if (!setId) {
        return (
            <ErrorSelfTest message="Missing set ID" />
        );
    }

    if (isSetLoading || (shouldLoadQuestions && isQuestionsLoading)) {
        return <LoadingSelfTest />;
    }

    if (isSetError || (shouldLoadQuestions && isQuestionsError)) {
        const setMessage = setError instanceof Error ? setError.message : "";
        const questionMessage = questionsError instanceof Error ? questionsError.message : "";
        const message = setMessage || questionMessage || "";
        return <ErrorSelfTest message={message} />;
    }

    if (!shouldLoadQuestions || !endTime || !questions) {
        return (
            <SelfTestPreview
                set={set}
                questionCountLabel={questionCountLabel}
                durationInMinutes={durationInMinutes}
                onStart={handleStart}
            />
        );
    }

    return (
        <SelfTestActive
            set={set}
            questions={questions || []}
            endTime={endTime}
            onSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
        />
    );
}

export default SelfTest;

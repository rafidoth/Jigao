import ExistingSetHeader from "@/components/existing_set/ExistingSetHeader.tsx";
import QuestionCard from "@/components/question-cards/QuestionCard";
import { useParams } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getSet, getQuestions } from "@/api/query";
import { Info as InfoIcon } from "lucide-react";
import useExistingSetStore from "../store/existingSetStore.ts";
import type { Question } from "@/types/questions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function QuestionsList({
    items,
    gridLayout,
    showAnswer,
}: {
    items: Question[];
    gridLayout: boolean;
    showAnswer: boolean;
}) {
    const [selectedAnswers, setSelectedAnswers] = useState<
        Record<string, string>
    >({});
    const handleSelectingAnswer = (qId: string, ans: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [qId]: ans,
        }));
    };

    return (
        <ScrollArea className="h-[calc(100vh-100px)] w-full flex justify-center">
            <div
                className={`${gridLayout ? "grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3  px-3" : "flex flex-col items-center gap-3"}`}
            >
                {items.map((q, i: number) => (
                    <span key={q.question_id} className={`${gridLayout ? "" : "w-[700px]"}`}>
                        <QuestionCard
                            mode="practice"
                            question={q}
                            position={i + 1}
                            selected={selectedAnswers[q.question_id] || ""}
                            selectAnswer={handleSelectingAnswer}
                            showAnswer={showAnswer}
                        />
                    </span>
                ))}

                {items.length === 0 && (
                    <Card className="p-4">
                        <p className="text-muted-foreground">
                            No questions in this set yet.
                        </p>
                    </Card>
                )}
            </div>
            <div className="flex justify-center my-7">
                <Badge className="bg-blue-800/20 text-blue-500 my-6">
                    End of Questions
                </Badge>
            </div>
        </ScrollArea>
    );
}

function LoadingExistingSet() {
    const skeletonItems = Array.from({ length: 10 });
    return (
        <div className="flex flex-row flex-1 gap-4 justify-center">
            <div className="flex flex-col gap-4 w-full">
                {/* Header skeleton */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                    <div className="flex flex-col gap-3 px-3 md:px-6 py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-3 w-full">
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-7 sm:h-8 md:h-9 w-2/3" />
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <Skeleton className="h-9 w-32" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Grid skeleton */}
                <ScrollArea className="h-[calc(100vh-100px)]">
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 px-3">
                        {skeletonItems.map((_, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-16 rounded" />
                                        <Skeleton className="h-5 w-20 rounded" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-4/6" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-9 w-full rounded-md" />
                                        <Skeleton className="h-9 w-full rounded-md" />
                                        <Skeleton className="h-9 w-full rounded-md" />
                                        <Skeleton className="h-9 w-full rounded-md" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

function ErrorExistingSet({ message }: { message?: string }) {
    const isAccessDenied =
        message ===
        "Sorry, you don't have access to this question set. Please contact the set owner if you think this is a mistake.";

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
            <Alert variant={isAccessDenied ? "default" : "destructive"}>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>{isAccessDenied ? "Access denied" : "Error"}</AlertTitle>
                <AlertDescription>
                    {isAccessDenied
                        ? message
                        : `Error loading questions${message ? `: ${message}` : ""}`}
                </AlertDescription>
            </Alert>
        </div>
    );
}

function getErrorDetails(error: unknown): { isForbidden: boolean; message: string } {
    if (!error || typeof error !== "object") {
        return { isForbidden: false, message: "" };
    }

    const errorWithMessage = error as { message?: unknown };
    const response = (error as { response?: unknown }).response;

    if (!response || typeof response !== "object") {
        return {
            isForbidden: false,
            message:
                typeof errorWithMessage.message === "string"
                    ? errorWithMessage.message
                    : "",
        };
    }

    const status = (response as { status?: unknown }).status;
    const data = (response as { data?: unknown }).data;
    const code =
        data && typeof data === "object"
            ? (data as { code?: unknown }).code
            : undefined;

    const isForbidden = status === 403 || code === "FORBIDDEN";

    return {
        isForbidden,
        message:
            typeof errorWithMessage.message === "string"
                ? errorWithMessage.message
                : "",
    };
}

function ExistingSet() {
    const { set_id } = useParams();

    const results = useQueries({
        queries: [
            {
                queryKey: ["set", set_id],
                queryFn: () => getSet(set_id as string),
                staleTime: 5 * 60 * 1000,
            },
            {
                queryKey: ["questions", set_id],
                queryFn: () => getQuestions(set_id as string),
                staleTime: 5 * 60 * 1000,
            },
        ],
    });

    const {
        data: set,
        isLoading: isSetLoading,
        isError: isSetError,
        error: setError,
    } = results[0];
    const {
        data: questions,
        isLoading: isQuestionsLoading,
        isError: isQuestionsError,
        error: questionsError,
    } = results[1];
    const items = useMemo(() => questions || [], [questions]);
    const showAnswer = useExistingSetStore((state) => state.showAnswer);
    const toggleShowAnswer = useExistingSetStore(
        (state) => state.toggleShowAnswer,
    );
    const gridLayout = useExistingSetStore((state) => state.gridLayout);
    const toggleGridLayout = useExistingSetStore(
        (state) => state.toggleGridLayout,
    );
    if (isSetLoading || isQuestionsLoading) {
        return <LoadingExistingSet />;
    }

    if (isSetError || isQuestionsError) {
        const setErrorDetails = getErrorDetails(setError);
        const questionsErrorDetails = getErrorDetails(questionsError);

        const isForbidden =
            setErrorDetails.isForbidden || questionsErrorDetails.isForbidden;

        const message = isForbidden
            ? "Sorry, you don't have access to this question set. Please contact the set owner if you think this is a mistake."
            : setErrorDetails.message || questionsErrorDetails.message || "";

        return <ErrorExistingSet message={message} />;
    }

    return (
        <div className="flex flex-row flex-1 gap-4 justify-center">
            <div className="flex flex-col gap-4 w-full items-center">
                <ExistingSetHeader
                    set={set}
                    itemsLength={items.length}
                    showAnswer={showAnswer}
                    toggleShowAnswer={toggleShowAnswer}
                    gridLayout={gridLayout}
                    toggleGridLayout={toggleGridLayout}
                />
                <div className="w-3/4">
                    <QuestionsList
                        items={items}
                        gridLayout={gridLayout}
                        showAnswer={showAnswer}
                    />
                </div>
            </div>
        </div>
    );
}

export default ExistingSet;

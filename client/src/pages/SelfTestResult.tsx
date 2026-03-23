import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { getSelfTestResult } from "@/api/query";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    ArrowLeft,
    LoaderIcon,
    Trophy,
    Clock,
    Calendar,
    HelpCircle,
    CheckCircle2,
    XCircle,
    MinusCircle,
} from "lucide-react";
import type {
    SelfTestResultData,
    SelfTestQuestionResult,
    ChoiceResponse,
} from "@/types/questions";

// Hook to fetch self-test result
function useSelfTestResult(selfTestId: string | undefined) {
    return useQuery<{ success: boolean; data: SelfTestResultData }>({
        queryKey: ["self-test-result", selfTestId],
        enabled: !!selfTestId,
        queryFn: () => getSelfTestResult(selfTestId!),
        staleTime: 60_000,
        retry: 1,
    });
}

// Format seconds to mm:ss or hh:mm:ss
function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
}

// Difficulty badge styling
function difficultyClass(d: string) {
    const key = String(d || "").toLowerCase();
    if (key === "easy") {
        return "bg-emerald-600 text-emerald-50 dark:bg-emerald-600/80";
    }
    if (key === "medium") {
        return "bg-amber-500 text-amber-950 dark:bg-amber-500/90";
    }
    if (key === "hard") {
        return "bg-rose-600 text-rose-50 dark:bg-rose-600/80";
    }
    return "bg-muted text-foreground";
}

// Format label text
function typeLabel(t: string) {
    return String(t || "")
        .replaceAll("_", " ")
        .replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

// Stat Card component
function StatCard({
    icon: Icon,
    label,
    children,
}: {
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-2 bg-primary/10 rounded-xl px-4 py-3 min-w-[120px]">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

// True/False choices constant
const TRUE_FALSE_CHOICES = [
    { id: "true", text: "True", value: true },
    { id: "false", text: "False", value: false },
];

// Choice item for MCQ and True/False
function ChoiceItem({
    label,
    text,
    isCorrect,
    isUserAnswer,
    isUserCorrect,
}: {
    label: string;
    text: string;
    isCorrect: boolean;
    isUserAnswer: boolean;
    isUserCorrect: boolean;
}) {
    return (
        <div
            className={cn(
                "p-2 rounded-md border transition-colors flex items-center gap-2",
                isCorrect
                    ? "bg-green-950/40 border-green-700/50"
                    : isUserAnswer
                        ? "bg-red-950/40 border-red-700/50"
                        : "bg-muted/30 border-border"
            )}
        >
            <Badge variant="outline" className="w-7 justify-center text-xs">
                {label}
            </Badge>
            <span className="flex-1 text-sm">{text}</span>
            <div className="flex gap-1">
                {isCorrect && (
                    <Badge className="bg-green-600 text-xs">Correct</Badge>
                )}
                {isUserAnswer && !isUserCorrect && (
                    <Badge className="bg-red-600 text-xs">Your answer</Badge>
                )}
                {isUserAnswer && isUserCorrect && (
                    <Badge className="bg-green-600 text-xs">Your answer</Badge>
                )}
            </div>
        </div>
    );
}

// Render MCQ choices
function McqChoices({
    choices,
    correctPosition,
    userPosition,
    isCorrect,
}: {
    choices: ChoiceResponse[];
    correctPosition?: number;
    userPosition?: number;
    isCorrect: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            {choices.map((choice, idx) => (
                <ChoiceItem
                    key={choice.choice_id}
                    label={String.fromCharCode(65 + idx)}
                    text={choice.text}
                    isCorrect={choice.position === correctPosition}
                    isUserAnswer={choice.position === userPosition}
                    isUserCorrect={isCorrect}
                />
            ))}
        </div>
    );
}

// Render True/False choices
function TrueFalseChoices({
    correctBool,
    userBool,
    isCorrect,
}: {
    correctBool?: boolean;
    userBool?: boolean;
    isCorrect: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            {TRUE_FALSE_CHOICES.map((choice, idx) => (
                <ChoiceItem
                    key={choice.id}
                    label={String.fromCharCode(65 + idx)}
                    text={choice.text}
                    isCorrect={correctBool === choice.value}
                    isUserAnswer={userBool === choice.value}
                    isUserCorrect={isCorrect}
                />
            ))}
        </div>
    );
}

// Render Fill in the Blanks answer
function FillInBlanksAnswer({
    userAnswer,
    acceptedAnswers,
    isCorrect,
}: {
    userAnswer?: string;
    acceptedAnswers?: string[];
    isCorrect: boolean;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div
                className={cn(
                    "p-3 rounded-md border",
                    userAnswer
                        ? isCorrect
                            ? "bg-green-950/40 border-green-700/50"
                            : "bg-red-950/40 border-red-700/50"
                        : "bg-muted/30 border-border"
                )}
            >
                <span className="text-xs font-semibold text-muted-foreground">
                    Your answer:
                </span>
                <p className="text-sm mt-1">
                    {userAnswer || <span className="italic text-muted-foreground">Not answered</span>}
                </p>
            </div>
            {acceptedAnswers && acceptedAnswers.length > 0 && (
                <div className="p-3 rounded-md border bg-green-950/30 border-green-700/50">
                    <span className="text-xs font-semibold text-green-300">
                        Accepted answers:
                    </span>
                    <p className="text-sm mt-1 text-green-200">
                        {acceptedAnswers.join(", ")}
                    </p>
                </div>
            )}
        </div>
    );
}

// Render Short Question answer (not graded)
function ShortQuestionAnswer({
    userAnswer,
    modelAnswer,
}: {
    userAnswer?: string;
    modelAnswer?: string;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="p-3 rounded-md border bg-muted/30 border-border">
                <span className="text-xs font-semibold text-muted-foreground">
                    Your answer:
                </span>
                <p className="text-sm mt-1">
                    {userAnswer || <span className="italic text-muted-foreground">Not answered</span>}
                </p>
            </div>
            {modelAnswer && (
                <div className="p-3 rounded-md border bg-blue-950/30 border-blue-700/50">
                    <span className="text-xs font-semibold text-blue-300">
                        Model answer:
                    </span>
                    <p className="text-sm mt-1 text-blue-200">{modelAnswer}</p>
                </div>
            )}
        </div>
    );
}

// Status indicator
function StatusIndicator({ isCorrect }: { isCorrect: boolean | null }) {
    if (isCorrect === null) {
        return (
            <div className="flex items-center gap-1 text-yellow-400">
                <MinusCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">Not graded</span>
            </div>
        );
    }
    if (isCorrect) {
        return (
            <div className="flex items-center gap-1 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-semibold">Correct</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1 text-red-400">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Incorrect</span>
        </div>
    );
}

// Question Result Card
function QuestionResultCard({
    question,
    position,
}: {
    question: SelfTestQuestionResult;
    position: number;
}) {
    const { type, difficulty, text, choices, answer, user_answer, is_correct } = question;

    // Determine card background based on correctness
    const cardBg =
        is_correct === null
            ? "bg-yellow-950/20"
            : is_correct
                ? "bg-green-950/30"
                : "bg-red-950/30";

    // Check if user answered
    const hasUserAnswer = user_answer !== null;

    // Render answer body based on question type
    const renderAnswerBody = () => {
        switch (type) {
            case "multiple_choice_questions":
                if (!hasUserAnswer) {
                    return (
                        <div className="flex flex-col gap-2">
                            <div className="p-3 rounded-md border bg-muted/30 border-border">
                                <span className="text-sm italic text-muted-foreground">Not answered</span>
                            </div>
                            <McqChoices
                                choices={choices || []}
                                correctPosition={answer.correct_choice_position}
                                userPosition={undefined}
                                isCorrect={false}
                            />
                        </div>
                    );
                }
                return (
                    <McqChoices
                        choices={choices || []}
                        correctPosition={answer.correct_choice_position}
                        userPosition={user_answer?.selected_choice_position}
                        isCorrect={is_correct === true}
                    />
                );

            case "true_false":
                if (!hasUserAnswer) {
                    return (
                        <div className="flex flex-col gap-2">
                            <div className="p-3 rounded-md border bg-muted/30 border-border">
                                <span className="text-sm italic text-muted-foreground">Not answered</span>
                            </div>
                            <TrueFalseChoices
                                correctBool={answer.correct_bool}
                                userBool={undefined}
                                isCorrect={false}
                            />
                        </div>
                    );
                }
                return (
                    <TrueFalseChoices
                        correctBool={answer.correct_bool}
                        userBool={user_answer?.selected_bool}
                        isCorrect={is_correct === true}
                    />
                );

            case "fill_in_the_blanks":
                return (
                    <FillInBlanksAnswer
                        userAnswer={user_answer?.text_answer}
                        acceptedAnswers={answer.accepted_answers}
                        isCorrect={is_correct === true}
                    />
                );

            case "short_question":
                return (
                    <ShortQuestionAnswer
                        userAnswer={user_answer?.text_answer}
                        modelAnswer={answer.model_answer}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <Card className={cn("p-4 rounded-xl border-none", cardBg)}>
            <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", difficultyClass(difficulty))}>
                            {typeLabel(difficulty)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {typeLabel(type)}
                        </Badge>
                    </div>
                    <StatusIndicator isCorrect={is_correct} />
                </div>

                {/* Question text */}
                <p className="font-medium text-sm">
                    {position}. {text}
                </p>

                {/* Answer body */}
                {renderAnswerBody()}

                {/* Explanation */}
                {answer.explanation && (
                    <div className="mt-2 p-3 bg-secondary/20 rounded-md">
                        <span className="text-xs font-semibold text-muted-foreground">
                            Explanation:
                        </span>
                        <p className="text-xs mt-1">{answer.explanation}</p>
                    </div>
                )}
            </div>
        </Card>
    );
}

// Main component
function SelfTestResult() {
    const { self_test_submission_id } = useParams();
    const navigate = useNavigate();

    const {
        data: resultData,
        isLoading,
        isError,
        error,
    } = useSelfTestResult(self_test_submission_id);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[100vh] gap-x-2">
                <LoaderIcon className="animate-spin" />
                <span className="text-base font-medium">Loading results...</span>
            </div>
        );
    }

    // Error state
    if (isError || !resultData?.success) {
        console.error("Error fetching self-test result:", error);
        return (
            <div className="max-w-xl mx-auto mt-20 px-4">
                <Alert variant="destructive">
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Failed to load self-test results. The test may not exist or you don't have access.
                    </AlertDescription>
                </Alert>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    const data = resultData.data;
    const scorePercent = data.gradable_count > 0
        ? Math.round((data.correct_count / data.gradable_count) * 100)
        : 0;

    return (
        <ScrollArea className="h-[100vh] w-full">
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Top Navigation */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => navigate(`/set/${data.set_id}`)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <p className="text-xs text-muted-foreground">Self Test Result</p>
                        <h1 className="text-lg font-bold">{data.set_title}</h1>
                    </div>
                </div>

                {/* Stats Header */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    <StatCard icon={Trophy} label="Score">
                        <div className="flex flex-col items-center">
                            <Badge className="bg-accent font-bold text-lg px-3">
                                {data.correct_count} / {data.gradable_count}
                            </Badge>
                            <span className="text-xs text-muted-foreground mt-1">
                                {scorePercent}%
                            </span>
                        </div>
                    </StatCard>

                    <StatCard icon={HelpCircle} label="Questions">
                        <Badge className="bg-accent font-bold">
                            {data.question_count} total
                        </Badge>
                    </StatCard>

                    <StatCard icon={Clock} label="Time Taken">
                        <Badge className="bg-accent font-bold">
                            {formatTime(data.time_taken_seconds)}
                        </Badge>
                    </StatCard>

                    <StatCard icon={Calendar} label="Submitted">
                        <div className="flex flex-col items-center gap-1">
                            <Badge className="bg-accent font-bold text-xs">
                                {format(new Date(data.created_at), "dd MMM, yyyy")}
                            </Badge>
                            <Badge className="bg-accent font-bold text-xs">
                                {format(new Date(data.created_at), "hh:mm a")}
                            </Badge>
                        </div>
                    </StatCard>
                </div>

                {/* Score Summary Banner */}
                <div
                    className={cn(
                        "mb-6 p-4 rounded-xl text-center",
                        scorePercent >= 70
                            ? "bg-green-950/30 border border-green-700/30"
                            : scorePercent >= 40
                                ? "bg-yellow-950/30 border border-yellow-700/30"
                                : "bg-red-950/30 border border-red-700/30"
                    )}
                >
                    <p className="text-2xl font-bold">
                        {scorePercent >= 70
                            ? "Great job!"
                            : scorePercent >= 40
                                ? "Good effort!"
                                : "Keep practicing!"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        You answered {data.correct_count} out of {data.gradable_count} gradable questions correctly
                        {data.question_count > data.gradable_count && (
                            <span> ({data.question_count - data.gradable_count} short questions not graded)</span>
                        )}
                    </p>
                </div>

                {/* Questions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {data.questions.map((q, idx) => (
                        <QuestionResultCard
                            key={q.question_id}
                            question={q}
                            position={idx + 1}
                        />
                    ))}
                </div>

                {/* Bottom Navigation */}
                <div className="flex justify-center pb-8">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/set/${data.set_id}`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Set
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
}

export default SelfTestResult;

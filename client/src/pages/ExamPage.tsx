import { Link, useParams } from "react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { useSession } from "@clerk/clerk-react";
import { LoaderIcon, ShieldAlert, WifiOff } from "lucide-react";

import { getExamById, getQuestionsByExamId } from "@/api/query";
import { joinExamApiPost } from "@/api/mutation";
import RunningExam from "./ExamPageComponents/RunningExamPage";
import ExamPageWaitingUI from "./ExamPageComponents/WaitingExamPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    getWsUrl,
    isJoinExamResponse,
    toExamUIStatus,
    type JoinExamResponse,
    type SocketMessage,
} from "./ExamPageComponents/exam-session.types";

type ExamDetails = {
    id: string;
    title: string;
    description: string;
    visibility: string;
    start_time: string;
    end_time: string;
    duration: number;
    session_status: string;
};

function ExamPageEndedUI({ endTime, title }: { endTime: Date; title: string }) {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>{title || "Exam ended"}</CardTitle>
                <CardDescription>Ended at: {endTime.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">You may close this window.</p>
            </CardContent>
        </Card>
    );
}

function ExamDetailsSkeleton() {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader className="gap-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-5 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-2/5" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-40" />
            </CardFooter>
        </Card>
    );
}

function ExamConnectingState() {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Connecting to exam room</CardTitle>
                <CardDescription>Please wait while we establish a secure connection.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderIcon className="animate-spin" />
                    Preparing your exam session...
                </div>
            </CardContent>
        </Card>
    );
}

function ExamDetailsGate({
    exam,
    isJoining,
    isConnected,
    onJoin,
    forbidden,
    joinError,
}: {
    exam: ExamDetails;
    isJoining: boolean;
    isConnected: boolean;
    onJoin: () => void;
    forbidden: boolean;
    joinError?: string;
}) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeUntilStart = useMemo(() => {
        return Math.max(0, new Date(exam.start_time).getTime() - now);
    }, [exam.start_time, now]);

    const countdownLabel = useMemo(() => {
        if (timeUntilStart <= 0) return "Exam is starting now";

        const totalMinutes = Math.floor(timeUntilStart / 60_000);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;

        return `${days}d ${hours}h ${minutes}m`;
    }, [timeUntilStart]);

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="text-2xl">{exam.title}</CardTitle>
                <CardDescription className="text-sm">
                    {exam.description || "No description provided."}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">Starts</p>
                        <p className="text-sm font-medium">
                            {format(new Date(exam.start_time), "d MMM yyyy, p")}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">Ends</p>
                        <p className="text-sm font-medium">
                            {format(new Date(exam.end_time), "d MMM yyyy, p")}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">Duration</p>
                        <p className="text-sm font-medium">{exam.duration} minutes</p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">Visibility</p>
                        <p className="text-sm font-medium capitalize">{exam.visibility}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                        {exam.session_status}
                    </Badge>
                    {isConnected ? <Badge variant="secondary">Connected</Badge> : null}
                </div>

                <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Time until exam starts</p>
                    <p className="text-sm font-semibold">{countdownLabel}</p>
                </div>

                {forbidden ? (
                    <Alert variant="destructive">
                        <ShieldAlert />
                        <AlertTitle>Access denied</AlertTitle>
                        <AlertDescription>
                            Sorry, you&apos;re not allowed to join this exam.
                        </AlertDescription>
                    </Alert>
                ) : null}

                {!forbidden && joinError ? (
                    <Alert variant="destructive">
                        <WifiOff />
                        <AlertTitle>Could not join exam</AlertTitle>
                        <AlertDescription>{joinError}</AlertDescription>
                    </Alert>
                ) : null}
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-3">
                <Button variant="outline" asChild>
                    <Link to="/exams">Back</Link>
                </Button>
                <Button onClick={onJoin} disabled={isJoining}>
                    {isJoining ? <LoaderIcon data-icon="inline-start" className="animate-spin" /> : null}
                    {isJoining ? "Joining..." : "Join exam"}
                </Button>
            </CardFooter>
        </Card>
    );
}

function ExamPage() {
    const { exam_id } = useParams();
    const { session } = useSession();

    const [token, setToken] = useState<string | null>(null);
    const [joinInfo, setJoinInfo] = useState<JoinExamResponse | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [joinError, setJoinError] = useState<string | undefined>(undefined);

    const [title, setTitle] = useState("");
    const [examStatus, setExamStatus] = useState<"waiting" | "running" | "ended" | "">("");
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [endTime, setEndTime] = useState<Date>(new Date());

    const {
        data: examData,
        isLoading: isLoadingExam,
        isError: examLoadFailed,
    } = useQuery({
        queryKey: ["exam", exam_id],
        queryFn: () => getExamById(exam_id),
        enabled: !!exam_id,
        staleTime: 60_000,
    });

    const wsUrl = useMemo(() => {
        if (!joinInfo) return null;
        return getWsUrl(joinInfo.exam_id, joinInfo.role);
    }, [joinInfo]);

    const canConnectSocket = !!wsUrl && !!token;

    const { lastJsonMessage, sendJsonMessage, readyState } = useWebSocket(
        canConnectSocket ? wsUrl : null,
        {
            queryParams: token ? { token: `Bearer ${token}` } : {},
            shouldReconnect: () => true,
            reconnectAttempts: 5,
            reconnectInterval: 1500,
        },
    );

    const joinMutation = useMutation({
        mutationFn: (targetExamId: string) => joinExamApiPost(targetExamId),
        onSuccess: (data) => {
            if (!isJoinExamResponse(data)) {
                setJoinError("Invalid join response from server.");
                return;
            }

            setIsForbidden(false);
            setJoinError(undefined);
            setJoinInfo(data);
            setExamStatus(toExamUIStatus(data.status));
            setStartTime(new Date(data.start_time));
            setEndTime(new Date(data.end_time));
            if (examData?.title) setTitle(examData.title);
        },
        onError: (error) => {
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                setIsForbidden(true);
                setJoinError(undefined);
                return;
            }

            const message = axios.isAxiosError(error)
                ? (error.response?.data?.message ?? error.message)
                : "Failed to join exam. Please try again.";
            setJoinError(message);
            setIsForbidden(false);
        },
    });

    const sendEvent = useCallback(
        (type: string, payload: unknown) => {
            if (readyState === 1) {
                sendJsonMessage({ type, payload });
            }
        },
        [readyState, sendJsonMessage],
    );

    const { data: questions } = useQuery({
        queryKey: ["exam", exam_id, "questions"],
        queryFn: () => getQuestionsByExamId(exam_id),
        enabled: examStatus === "running",
        staleTime: 60_000,
    });

    const items = useMemo(() => questions || [], [questions]);

    useEffect(() => {
        if (!session) return;

        const loadToken = async () => {
            const tkn = await session.getToken();
            setToken(tkn);
        };

        loadToken();
    }, [session]);

    useEffect(() => {
        if (lastJsonMessage === null) return;

        const message = lastJsonMessage as SocketMessage;
        const payload = (message.payload ?? {}) as Record<string, unknown>;

        if (message.type === "on-join-room") {
            const rawStatus =
                typeof payload.examStatus === "string"
                    ? payload.examStatus
                    : typeof payload.exam_status === "string"
                        ? payload.exam_status
                        : "waiting";

            const mappedStatus =
                rawStatus === "live"
                    ? "running"
                    : rawStatus === "finished"
                        ? "ended"
                        : rawStatus === "waiting" || rawStatus === "running" || rawStatus === "ended"
                            ? rawStatus
                            : "waiting";

            const nextTitle = typeof payload.title === "string" ? payload.title : title;
            const time = typeof payload.time === "string" ? payload.time : undefined;

            setTitle(nextTitle);
            setExamStatus(mappedStatus);

            if (mappedStatus === "waiting" && time) {
                setStartTime(new Date(time));
            }

            if (mappedStatus !== "waiting" && time) {
                setEndTime(new Date(time));
            }

            return;
        }

        if (message.type === "exam-starts-now") {
            if (typeof payload.end_time !== "string") return;
            setExamStatus("running");
            setEndTime(new Date(payload.end_time));
            return;
        }

        if (message.type === "exam-ends-now") {
            if (typeof payload.end_time !== "string") return;
            setExamStatus("ended");
            setEndTime(new Date(payload.end_time));
        }
    }, [lastJsonMessage, title]);

    if (!exam_id) {
        return (
            <div className="w-full max-w-3xl mx-auto p-6">
                <Alert variant="destructive">
                    <ShieldAlert />
                    <AlertTitle>Invalid exam</AlertTitle>
                    <AlertDescription>Exam id is missing from URL.</AlertDescription>
                </Alert>
            </div>
        );
    }

    let examComponent: React.ReactNode = null;

    if (examStatus === "waiting") {
        examComponent = (
            <ExamPageWaitingUI startTime={startTime} title={title || examData?.title || "Exam"} />
        );
    }

    if (examStatus === "running") {
        examComponent = (
            <RunningExam
                endTime={endTime}
                title={title || examData?.title || "Exam"}
                exam_id={exam_id}
                questions={items}
                sendEvent={sendEvent}
                isConnected={readyState === 1}
            />
        );
    }

    if (examStatus === "ended") {
        examComponent = (
            <ExamPageEndedUI endTime={endTime} title={title || examData?.title || "Exam ended"} />
        );
    }

    return (
        <div className="w-full min-h-screen flex justify-center px-4 py-8">
            {joinInfo ? (
                examComponent || <ExamConnectingState />
            ) : isLoadingExam ? (
                <ExamDetailsSkeleton />
            ) : examLoadFailed || !examData ? (
                <div className="w-full max-w-3xl">
                    <Alert variant="destructive">
                        <ShieldAlert />
                        <AlertTitle>Unable to load exam</AlertTitle>
                        <AlertDescription>Please refresh and try again.</AlertDescription>
                    </Alert>
                </div>
            ) : (
                <ExamDetailsGate
                    exam={examData as ExamDetails}
                    isJoining={joinMutation.isPending}
                    isConnected={readyState === 1}
                    forbidden={isForbidden}
                    joinError={joinError}
                    onJoin={() => joinMutation.mutate(exam_id)}
                />
            )}

            <div className="fixed bottom-5 right-5 flex gap-2 justify-center items-center">
                <img src="/logo.png" className="size-8 rounded-md" />
                <Link to="/" className="text-sm font-bold">
                    Jigao
                </Link>
            </div>
        </div>
    );
}

export default ExamPage;

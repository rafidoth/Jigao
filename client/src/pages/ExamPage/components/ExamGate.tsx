import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, ShieldAlert, WifiOff } from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    useExamDescription,
    useExamDuration,
    useExamPhase,
    useExamStore,
    useExamTitle,
    useExamVisibility,
    useEndTime,
    useErrorMessage,
    useStartTime,
} from "../store/examStore";

function ExamGate() {
    const phase = useExamPhase();
    const title = useExamTitle();
    const description = useExamDescription();
    const visibility = useExamVisibility();
    const duration = useExamDuration();
    const startTime = useStartTime();
    const endTime = useEndTime();
    const errorMessage = useErrorMessage();
    const joinExam = useExamStore((s) => s.joinExam);

    const [now, setNow] = useState(() => Date.now());

    // Update now every second for countdown
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeUntilStart = useMemo(() => {
        if (!startTime) return 0;
        return Math.max(0, startTime.getTime() - now);
    }, [startTime, now]);

    const countdownLabel = useMemo(() => {
        if (timeUntilStart <= 0) return "Exam is starting now";

        const totalMinutes = Math.floor(timeUntilStart / 60_000);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }, [timeUntilStart]);

    const isJoining = phase === "joining";
    const isForbidden = errorMessage?.includes("not allowed");

    const handleJoin = useCallback(() => {
        joinExam();
    }, [joinExam]);

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="text-2xl">{title || "Exam"}</CardTitle>
                <CardDescription className="text-sm">
                    {description || "No description provided."}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {startTime && (
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground text-xs">Starts</p>
                            <p className="text-sm font-medium">{format(startTime, "d MMM yyyy, p")}</p>
                        </div>
                    )}
                    {endTime && (
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground text-xs">Ends</p>
                            <p className="text-sm font-medium">{format(endTime, "d MMM yyyy, p")}</p>
                        </div>
                    )}
                    <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">Duration</p>
                        <p className="text-sm font-medium">{duration} minutes</p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs">Visibility</p>
                        <p className="text-sm font-medium capitalize">{visibility}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                        Not joined
                    </Badge>
                </div>

                <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Time until exam starts</p>
                    <p className="text-sm font-semibold">{countdownLabel}</p>
                </div>

                {isForbidden && (
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Access denied</AlertTitle>
                        <AlertDescription>Sorry, you&apos;re not allowed to join this exam.</AlertDescription>
                    </Alert>
                )}

                {!isForbidden && errorMessage && (
                    <Alert variant="destructive">
                        <WifiOff className="h-4 w-4" />
                        <AlertTitle>Could not join exam</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-3">
                <Button variant="outline" asChild>
                    <Link to="/exams">Back</Link>
                </Button>
                <Button onClick={handleJoin} disabled={isJoining || isForbidden}>
                    {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isJoining ? "Joining..." : "Join exam"}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default ExamGate;

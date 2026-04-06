import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { LoaderIcon, ShieldAlert, WifiOff } from "lucide-react";

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

import type { ExamDetails } from "./types";

type ExamDetailsGateProps = {
  exam: ExamDetails;
  isJoining: boolean;
  isConnected: boolean;
  onJoin: () => void;
  forbidden: boolean;
  joinError?: string;
};

function ExamDetailsGate({
  exam,
  isJoining,
  isConnected,
  onJoin,
  forbidden,
  joinError,
}: ExamDetailsGateProps) {
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
            <p className="text-sm font-medium">{format(new Date(exam.start_time), "d MMM yyyy, p")}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Ends</p>
            <p className="text-sm font-medium">{format(new Date(exam.end_time), "d MMM yyyy, p")}</p>
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
            <AlertDescription>Sorry, you&apos;re not allowed to join this exam.</AlertDescription>
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

export default ExamDetailsGate;

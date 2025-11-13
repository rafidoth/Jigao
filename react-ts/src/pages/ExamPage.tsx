import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import { differenceInSeconds } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import QuestionCard from "../components/question_cards/question_card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDuration(seconds: number) {
  if (seconds <= 0) return "00:00:00";
  const days = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  return `${days > 0 ? `${days}d ` : ""}${hours
    .toString()
    .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function useRemainingSeconds(untilThisTime: Date) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    differenceInSeconds(untilThisTime, new Date()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const secondsLeft = differenceInSeconds(untilThisTime, new Date());
      setRemainingSeconds(secondsLeft);
      if (secondsLeft <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [untilThisTime]);

  return remainingSeconds;
}

function CountdownText({ until }: { until: Date }) {
  const remainingSeconds = useRemainingSeconds(until);
  return <span className="font-mono">{formatDuration(remainingSeconds)}</span>;
}

// function StatusBadge({ status }: { status: string }) {
//   const variant: React.ComponentProps<typeof Badge>["variant"] =
//     status === "running"
//       ? "default"
//       : status === "waiting"
//         ? "secondary"
//         : status === "ended"
//           ? "outline"
//           : "secondary";
//   const label =
//     status === "running"
//       ? "In Progress"
//       : status === "waiting"
//         ? "Waiting"
//         : status === "ended"
//           ? "Ended"
//           : "Unknown";
//   return <Badge variant={variant}>{label}</Badge>;
// }

// function WsIndicator({ state }: { state: ReadyState }) {
//   const dot =
//     state === ReadyState.OPEN
//       ? "bg-emerald-500"
//       : state === ReadyState.CONNECTING
//         ? "bg-amber-500 animate-pulse"
//         : state === ReadyState.CLOSING
//           ? "bg-zinc-400"
//           : "bg-red-500";
//   return (
//     <div className="flex items-center gap-2 text-xs text-muted-foreground">
//       <span className={`inline-block size-2.5 rounded-full ${dot}`} />
//       <span className="hidden sm:inline">{ReadyState[state]}</span>
//     </div>
//   );
// }

function ExamPageWaitingUI({ startTime }: { startTime: Date }) {
  return (
    <Card className="w-3/4">
      <CardContent>
        <div className="flex justify-between">
          <div>
            <p className="font-semibold">Waiting for exam to start</p>
            <div className="text-gray-400">
              Start time: {startTime.toLocaleString()}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 py-2">
            <div className="text-xs text-muted-foreground">Starts in</div>
            <div className="font-mono text-2xl">
              <CountdownText until={startTime} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExamPageRunningUI({ endTime }: { endTime: Date }) {
  return (
    <Card className="w-3/4">
      <CardHeader className="border-b">
        <CardTitle>Exam in progress</CardTitle>
        <CardDescription>End time: {endTime.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-1 py-2">
          <div className="text-xs text-muted-foreground">Ends in</div>
          <div className="font-mono text-2xl">
            <CountdownText until={endTime} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExamPageEndedUI({ endTime }: { endTime: Date }) {
  return (
    <Card className="w-3/4">
      <CardHeader className="border-b">
        <CardTitle>Exam ended</CardTitle>
        <CardDescription>Ended at: {endTime.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          You may close this window.
        </p>
      </CardContent>
    </Card>
  );
}

async function getQuestionsByExamId(exam_id: string | undefined) {
  const res = await axios.get(`/api/v1/exams/q/${exam_id}`);
  return res.data;
}

function ExamPageQuestionsUI({ items }: { items: any[] }) {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const handleSelectingAnswer = (qId: string, ans: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: ans,
    }));
  };

  const answered = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers],
  );

  return (
    <div className="relative">
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pr-3">
          {items.map((q: any, i: number) => (
            <QuestionCard
              key={q.id}
              question={q}
              position={i + 1}
              selected={selectedAnswers[q.id] || ""}
              selectAnswer={handleSelectingAnswer}
            />
          ))}

          {items.length === 0 && (
            <Card className="p-4">
              <p className="text-muted-foreground">
                No questions in this set yet.
              </p>
            </Card>
          )}
        </div>
      </ScrollArea>

      <div className="fixed bottom-4 right-4 z-30">
        <Button size="lg" className="shadow-lg" disabled>
          Submit ({answered}/{items.length})
        </Button>
      </div>
    </div>
  );
}

function ExamPage() {
  const { exam_id } = useParams();

  const socketUrl = `ws://localhost:9999/api/v1/exams/join/${exam_id}?role=p`;
  const { lastJsonMessage, readyState } = useWebSocket(socketUrl, {
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
    },
  });

  const [title, setTitle] = useState("");
  const [examStatus, setExamStatus] = useState("");

  const { data: questions, isLoading } = useQuery({
    queryKey: ["exam_id", exam_id],
    queryFn: () => getQuestionsByExamId(exam_id),
    enabled: examStatus === "running",
  });

  const items = useMemo(() => questions || [], [questions]);

  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());

  let statusPanel: React.ReactNode = null;
  switch (examStatus) {
    case "waiting":
      if (startTime) statusPanel = <ExamPageWaitingUI startTime={startTime} />;
      break;
    case "running":
      if (endTime) statusPanel = <ExamPageRunningUI endTime={endTime} />;
      break;
    case "ended":
      if (endTime) statusPanel = <ExamPageEndedUI endTime={endTime} />;
      break;
  }

  useEffect(() => {
    if (lastJsonMessage !== null) {
      const type = (lastJsonMessage as any).type;
      const payload = (lastJsonMessage as any).payload;
      if (type === "on-join-room") {
        const status = payload.examStatus;
        const time = payload.time;
        const title = payload.title;
        setTitle(title);
        setExamStatus(status);

        if (status === "waiting" && time) {
          setStartTime(new Date(time));
        } else if (status === "running" && time) {
          setEndTime(new Date(time));
        } else if (time) {
          setEndTime(new Date(time));
        }
      } else if (type === "exam-starts-now") {
        setExamStatus("running");
        setEndTime(new Date(payload.end_time));
      } else if (type === "exam-ends-now") {
        setExamStatus("ended");
        setEndTime(new Date(payload.end_time));
      }
    }
  }, [lastJsonMessage]);

  return (
    <div className="space-y-4 flex flex-col justify-center align-center">
      <div className="flex justify-center text-3xl font-bold mt-5">
        {title || "Exam"}
      </div>
      <div className="w-full flex justify-center">{statusPanel}</div>

      {examStatus === "running" && (
        <>
          {isLoading && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                Loading questions…
              </p>
            </Card>
          )}
          {items.length > 0 && !isLoading && (
            <ExamPageQuestionsUI items={items} />
          )}
        </>
      )}
    </div>
  );
}

export default ExamPage;

import { Link } from "react-router";
import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import { differenceInSeconds } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import RunningExam from "./ExamPageComponents/RunningExamPage";
import ExamPageWaitingUI from "./ExamPageComponents/WaitingExamPage";
import { getQuestionsByExamId } from "@/api/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useSession } from "@clerk/clerk-react";

export function formatDuration(seconds: number) {
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

export function useRemainingSeconds(untilThisTime: Date) {
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

export function CountdownText({ until }: { until: Date }) {
  const remainingSeconds = useRemainingSeconds(until);
  return (
    <span className="font-display font-semibold">
      {formatDuration(remainingSeconds)}
    </span>
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

function ExamPage() {
  const { exam_id } = useParams();
  const { session } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const socketUrl = `ws://localhost:9999/api/v1/exams/join/${exam_id}`;
  const { lastJsonMessage, sendJsonMessage, readyState } = useWebSocket(
    token ? socketUrl : null,
    {
      queryParams: token ? { token: token } : {},
      onMessage: (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);
      },
    },
  );
  const sendEvent = (type: string, payload: any) => {
    if (readyState === 1) {
      sendJsonMessage({ type, payload });
    } else {
      console.error("Connection not open");
    }
  };

  const [title, setTitle] = useState("");
  const [examStatus, setExamStatus] = useState("");

  const { data: questions } = useQuery({
    queryKey: ["exam_id", exam_id],
    queryFn: () => getQuestionsByExamId(exam_id),
    enabled: examStatus === "running",
  });
  const items = useMemo(() => questions || [], [questions]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  let examComponent: React.ReactNode = null;
  switch (examStatus) {
    case "waiting":
      if (startTime)
        examComponent = (
          <ExamPageWaitingUI startTime={startTime} title={title} />
        );
      break;
    case "running":
      if (endTime)
        examComponent = (
          <RunningExam
            endTime={endTime}
            title={title}
            exam_id={exam_id}
            questions={items}
            sendEvent={sendEvent}
            isConnected={readyState === 1}
          />
        );
      break;
    case "ended":
      if (endTime) examComponent = <ExamPageEndedUI endTime={endTime} />;
      break;
  }

  useEffect(() => {
    if (session) {
      const fn = async () => {
        const tkn = await session?.getToken();
        setToken(tkn);
      };
      fn();
    }
  }, [session]);

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
    <div className="w-full flex justify-center">
      {examComponent}

      <div className="absolute bottom-5 right-5 flex  gap-x-2 justify-center items-center z-10">
        <img src="/logo.png" className="w-8 h-8 rounded-md" />
        <Link to="/" className="text-xl font-bold">
          Jigao
        </Link>
      </div>
    </div>
  );
}

export default ExamPage;

import { Link } from "react-router";
import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useQuery } from "@tanstack/react-query";
import RunningExam from "./ExamPageComponents/RunningExamPage";
import ExamPageWaitingUI from "./ExamPageComponents/WaitingExamPage";
import { getQuestionsByExamId } from "@/api/query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useSession } from "@clerk/clerk-react";

function ExamPageEndedUI({ endTime }: { endTime: Date }) {
  return (
    <Card className="w-3/4">
      <CardHeader className="border-b">
        <CardTitle>Exam ended</CardTitle>
        <CardDescription>Ended at: {endTime.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">
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

  type JoinRoomPayload = {
    examStatus: string;
    time?: string;
    title: string;
  };

  type ExamStartsPayload = { end_time: string };
  type ExamEndsPayload = { end_time: string };

  type SocketPayload =
    | JoinRoomPayload
    | ExamStartsPayload
    | ExamEndsPayload
    | Record<string, unknown>;

  type SocketMessage = {
    type: string;
    payload: SocketPayload;
  };

  const sendEvent = (type: string, payload: unknown) => {
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
      const message = lastJsonMessage as SocketMessage;
      const type = message.type;
      const payload = message.payload;
      if (type === "on-join-room") {
        if (
          !("examStatus" in payload) ||
          !("title" in payload) ||
          typeof payload.examStatus !== "string" ||
          typeof payload.title !== "string"
        ) {
          return;
        }

        const status = payload.examStatus;
        const time =
          "time" in payload && typeof payload.time === "string"
            ? payload.time
            : undefined;
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
        if (!("end_time" in payload) || typeof payload.end_time !== "string") {
          return;
        }
        setExamStatus("running");
        setEndTime(new Date(payload.end_time));
      } else if (type === "exam-ends-now") {
        if (!("end_time" in payload) || typeof payload.end_time !== "string") {
          return;
        }
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
        <Link to="/" className="text-sm font-bold">
          Jigao
        </Link>
      </div>
    </div>
  );
}

export default ExamPage;

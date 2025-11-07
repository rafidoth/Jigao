import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { differenceInSeconds } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import QuestionCard from "../components/question_cards/question_card";
import { Card, Text, ScrollArea, Grid } from "@radix-ui/themes";
import { rootDomain } from "../api/api";

function formatDuration(seconds) {
  if (seconds <= 0) return "00:00:00";
  const days = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  return `${days > 0 ? `${days}d ` : ""}${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function CountdownClock({ untilThisTime }) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    differenceInSeconds(untilThisTime, new Date()),
  );

  useEffect(() => {
    // Update remaining time every second
    const interval = setInterval(() => {
      const secondsLeft = differenceInSeconds(untilThisTime, new Date());
      setRemainingSeconds(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [untilThisTime]);

  return (
    <div>
      <h2>Time Remaining</h2>
      <div style={{ fontFamily: "monospace", fontSize: "24px" }}>
        {formatDuration(remainingSeconds)}
      </div>
    </div>
  );
}

function ExamPageWaitingUI({ startTime }) {
  return (
    <div>
      <div>Start Time : {startTime.toLocaleString()}</div>
      <div>Exam Hasn't been started yet.</div>
      <CountdownClock untilThisTime={startTime} />
    </div>
  );
}

function ExamPageRunningUI({ endTime }) {
  return (
    <div>
      <div>End Time : {endTime.toLocaleString()}</div>
      <div>Exam Running.</div>
      <CountdownClock untilThisTime={endTime} />
    </div>
  );
}

function ExamPageEndedUI({ endTime }) {
  return (
    <div>
      <div>End Time : {endTime.toLocaleString()}</div>
      <div>Exam Ended.</div>
    </div>
  );
}

async function getQuestionsByExamId(exam_id) {
  const res = await axios.get(`${rootDomain}/api/v1/exams/q/${exam_id}`);
  return res.data;
}

// async function getExamDetails(exam_id) {
//   const res = await axios.get(`http://localhost:9999/api/v1/exams/${exam_id}`);
//   return res.data;
// }

function ExamPageQuestionsUI({ items }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const handleSelectingAnswer = (qId, ans) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: ans,
    }));
  };

  return (
    <ScrollArea
      type="hover"
      scrollbars="vertical"
      style={{ height: "calc(100vh - 100px)" }}
    >
      <Grid
        gap="3"
        columns={{ initial: "1", sm: "2", md: "3", lg: "4", xl: "5" }}
        align="baseline"
        pr="3"
      >
        {items.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            position={i + 1}
            selected={selectedAnswers[q.id]}
            selectAnswer={handleSelectingAnswer}
          />
        ))}

        {items.length === 0 && (
          <Card size="3">
            <Text color="gray">No questions in this set yet.</Text>
          </Card>
        )}
      </Grid>
    </ScrollArea>
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
  console.log(items);

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  let examUi;
  switch (examStatus) {
    case "waiting":
      if (startTime) {
        examUi = <ExamPageWaitingUI startTime={startTime} />;
      }
      break;
    case "running":
      if (endTime) {
        examUi = <ExamPageRunningUI endTime={endTime} />;
      }
      break;
    case "ended":
      if (endTime) {
        examUi = <ExamPageEndedUI endTime={endTime} />;
      }
  }

  useEffect(() => {
    if (lastJsonMessage !== null) {
      const type = lastJsonMessage.type;
      const payload = lastJsonMessage.payload;
      if (type === "on-join-room") {
        const status = payload.examStatus;
        const time = payload.time;
        const title = payload.title;
        setTitle(title);
        setExamStatus(status);

        if (status === "waiting" && time) {
          setStartTime(time);
        } else if (status === "running" && time) {
          setEndTime(time);
        } else {
          setEndTime(time);
        }
      } else if (type === "exam-starts-now") {
        setExamStatus("running");
        setEndTime(payload.end_time);
      } else if (type === "exam-ends-now") {
        setExamStatus("ended");
        setEndTime(payload.end_time);
      }
    }
  }, [lastJsonMessage]);

  return (
    <div>
      <div> Exam Page for {exam_id}</div>
      <h1>{title}</h1>
      <div style={{ marginTop: 12 }}>
        <div> WebSocket Status: {ReadyState[readyState]} </div>
      </div>
      {examUi}
      {items.length > 0 && !isLoading && <ExamPageQuestionsUI items={items} />}
    </div>
  );
}

export default ExamPage;

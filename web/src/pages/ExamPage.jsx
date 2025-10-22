import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  intervalToDuration,
  formatDistanceStrict,
  differenceInSeconds,
} from "date-fns";

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
  const start = new Date(untilThisTime);
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

function ExamPage() {
  const { exam_id } = useParams();

  const socketUrl = `ws://localhost:9999/api/v1/exams/join/${exam_id}?role=p`;
  const { sendMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl, {
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
    },
  });

  const [examStatus, setExamStatus] = useState("");
  const [startTime, setStartTime] = useState(new Date());

  const examStatusMessage =
    examStatus === "ended"
      ? "The exam has ended."
      : examStatus === "running"
        ? "The exam is ongoing."
        : "The exam has not started yet.";

  useEffect(() => {
    if (lastJsonMessage !== null) {
      const type = lastJsonMessage.eventType;
      if (type === "on-join-room") {
        setExamStatus(lastJsonMessage.examStatus);
        setStartTime(
          lastJsonMessage.startTime
            ? new Date(lastJsonMessage.startTime)
            : new Date(),
        );
      }
    }
  }, [lastJsonMessage]);

  return (
    <div>
      <div> Exam Page for {exam_id}</div>

      <div style={{ marginTop: 8 }}>
        <CountdownClock untilThisTime={startTime} />
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Exam Metadata:</h3>
        <div> Start Time: {startTime.toLocaleString()} </div>
        <div>{examStatusMessage}</div>
        <div> WebSocket Status: {ReadyState[readyState]} </div>
      </div>
    </div>
  );
}

export default ExamPage;

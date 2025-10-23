import { useParams } from "react-router";
import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { differenceInSeconds } from "date-fns";

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

function ExamPage() {
  const { exam_id } = useParams();

  const socketUrl = `ws://localhost:9999/api/v1/exams/join/${exam_id}?role=p`;
  const { lastJsonMessage, readyState } = useWebSocket(socketUrl, {
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
    },
  });

  const [examStatus, setExamStatus] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [examUI, setExamUI] = useState(null);

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

      <div style={{ marginTop: 12 }}>
        <div> WebSocket Status: {ReadyState[readyState]} </div>
      </div>
      {examUi}
    </div>
  );
}

export default ExamPage;

import RunningExam from "./RunningExamPage";
import ExamPageEndedUI from "./exam-page-ended-ui";
import ProtectedWaitingPage from "./protected-waiting-page";
import type { ExamStatus } from "./types";
import type { Question } from "@/types/questions";

type ProtectedExamFlowProps = {
  examStatus: ExamStatus;
  startTime: Date;
  endTime: Date;
  title: string;
  examId: string;
  questions: Question[];
  sendEvent: (type: string, payload: unknown) => void;
  isConnected: boolean;
};

function ProtectedExamFlow({
  examStatus,
  startTime,
  endTime,
  title,
  examId,
  questions,
  sendEvent,
  isConnected,
}: ProtectedExamFlowProps) {
  if (examStatus === "waiting") {
    return <ProtectedWaitingPage startTime={startTime} title={title || "Protected exam"} />;
  }

  if (examStatus === "running") {
    return (
      <RunningExam
        endTime={endTime}
        title={title || "Protected exam"}
        exam_id={examId}
        questions={questions}
        sendEvent={sendEvent}
        isConnected={isConnected}
      />
    );
  }

  if (examStatus === "ended") {
    return <ExamPageEndedUI endTime={endTime} title={title || "Protected exam ended"} />;
  }

  return null;
}

export default ProtectedExamFlow;

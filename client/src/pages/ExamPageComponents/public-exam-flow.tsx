import RunningExam from "./RunningExamPage";
import ExamPageEndedUI from "./exam-page-ended-ui";
import PublicWaitingPage from "./public-waiting-page";
import type { ExamStatus } from "./types";
import type { Question } from "@/types/questions";

type PublicExamFlowProps = {
  examStatus: ExamStatus;
  startTime: Date;
  endTime: Date;
  title: string;
  examId: string;
  questions: Question[];
  sendEvent: (type: string, payload: unknown) => void;
  isConnected: boolean;
};

function PublicExamFlow({
  examStatus,
  startTime,
  endTime,
  title,
  examId,
  questions,
  sendEvent,
  isConnected,
}: PublicExamFlowProps) {
  if (examStatus === "waiting") {
    return <PublicWaitingPage startTime={startTime} title={title || "Public exam"} />;
  }

  if (examStatus === "running") {
    return (
      <RunningExam
        endTime={endTime}
        title={title || "Public exam"}
        exam_id={examId}
        questions={questions}
        sendEvent={sendEvent}
        isConnected={isConnected}
      />
    );
  }

  if (examStatus === "ended") {
    return <ExamPageEndedUI endTime={endTime} title={title || "Public exam ended"} />;
  }

  return null;
}

export default PublicExamFlow;

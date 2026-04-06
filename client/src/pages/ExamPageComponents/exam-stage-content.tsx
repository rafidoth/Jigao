import RunningExam from "./RunningExamPage";
import ExamPageEndedUI from "./exam-page-ended-ui";
import FriendlyWaitingPage from "./friendly-waiting-page";
import type { ExamStatus } from "./types";
import type { Question } from "@/types/questions";

type ExamStageContentProps = {
  examStatus: ExamStatus;
  startTime: Date;
  endTime: Date;
  title: string;
  examId: string;
  questions: Question[];
  sendEvent: (type: string, payload: unknown) => void;
  isConnected: boolean;
};

function ExamStageContent({
  examStatus,
  startTime,
  endTime,
  title,
  examId,
  questions,
  sendEvent,
  isConnected,
}: ExamStageContentProps) {
  if (examStatus === "waiting") {
    return <FriendlyWaitingPage startTime={startTime} title={title || "Exam"} />;
  }

  if (examStatus === "running") {
    return (
      <RunningExam
        endTime={endTime}
        title={title || "Exam"}
        exam_id={examId}
        questions={questions}
        sendEvent={sendEvent}
        isConnected={isConnected}
      />
    );
  }

  if (examStatus === "ended") {
    return <ExamPageEndedUI endTime={endTime} title={title || "Exam ended"} />;
  }

  return null;
}

export default ExamStageContent;

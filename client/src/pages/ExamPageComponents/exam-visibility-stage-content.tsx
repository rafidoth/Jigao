import FriendlyExamFlow from "./friendly-exam-flow";
import ProtectedExamFlow from "./protected-exam-flow";
import PublicExamFlow from "./public-exam-flow";
import type { ExamStatus, ExamVisibility } from "./types";
import type { Question } from "@/types/questions";

type ExamVisibilityStageContentProps = {
  visibility?: string;
  examStatus: ExamStatus;
  startTime: Date;
  endTime: Date;
  title: string;
  examId: string;
  questions: Question[];
  sendEvent: (type: string, payload: unknown) => void;
  isConnected: boolean;
};

function normalizeVisibility(visibility?: string): ExamVisibility {
  if (visibility === "public") return "public";
  if (visibility === "restricted") return "restricted";
  return "private";
}

function ExamVisibilityStageContent({
  visibility,
  examStatus,
  startTime,
  endTime,
  title,
  examId,
  questions,
  sendEvent,
  isConnected,
}: ExamVisibilityStageContentProps) {
  const mode = normalizeVisibility(visibility);

  if (mode === "public") {
    return (
      <PublicExamFlow
        examStatus={examStatus}
        startTime={startTime}
        endTime={endTime}
        title={title}
        examId={examId}
        questions={questions}
        sendEvent={sendEvent}
        isConnected={isConnected}
      />
    );
  }

  if (mode === "restricted") {
    return (
      <ProtectedExamFlow
        examStatus={examStatus}
        startTime={startTime}
        endTime={endTime}
        title={title}
        examId={examId}
        questions={questions}
        sendEvent={sendEvent}
        isConnected={isConnected}
      />
    );
  }

  return (
    <FriendlyExamFlow
      examStatus={examStatus}
      startTime={startTime}
      endTime={endTime}
      title={title}
      examId={examId}
      questions={questions}
      sendEvent={sendEvent}
      isConnected={isConnected}
    />
  );
}

export default ExamVisibilityStageContent;

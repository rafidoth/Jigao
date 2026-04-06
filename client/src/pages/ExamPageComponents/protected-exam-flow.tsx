import { ShieldCheck } from "lucide-react";

import RunningExam from "./RunningExamPage";
import ExamPageWaitingUI from "./WaitingExamPage";
import ExamPageEndedUI from "./exam-page-ended-ui";
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
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Protected exam lobby is active. Please remain connected for monitoring.
        </div>
        <ExamPageWaitingUI startTime={startTime} title={title || "Protected exam"} />
      </div>
    );
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

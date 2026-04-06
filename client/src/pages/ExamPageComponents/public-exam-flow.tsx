import { Globe } from "lucide-react";

import RunningExam from "./RunningExamPage";
import ExamPageWaitingUI from "./WaitingExamPage";
import ExamPageEndedUI from "./exam-page-ended-ui";
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
    return (
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-sm text-sky-700 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Public exam lobby is open. Keep this tab active until the session starts.
        </div>
        <ExamPageWaitingUI startTime={startTime} title={title || "Public exam"} />
      </div>
    );
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

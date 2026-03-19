import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountdownText } from "./countdown-text";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import type { Question } from "@/types/questions";
import { ExamQuestionCard } from "./running_exam/question-cards";
import { useRunningExamAnswers } from "./running_exam/use-running-exam-answers";

interface RunningExamHeaderProps {
  endTime: Date;
  title: string;
  submitExam?: () => void;
}

function RunningExamHeader({
  endTime,
  title,
  submitExam,
}: RunningExamHeaderProps) {
  return (
    <div
      className={cn(
        "flex justify-between items-center shrink-0 sticky top-0 z-10 border rounded-md p-4",
      )}
    >
      <div className="flex flex-col">
        <div className="text-xl">{title || "Exam"}</div>
        <Badge
          variant="outline"
          className="font-semibold select-none bg-blue-500/20 text-blue-500"
        >
          Exam in progress
        </Badge>
      </div>
      <Button variant="destructive" onClick={submitExam}>
        Submit Exam
      </Button>
      <div className="flex flex-col items-center justify-center gap-1 py-2">
        <div className="flex gap-x-2 items-center justify-center">
          <div className="text-muted-foreground">Ends in</div>
          <div className="font-mono text-lg">
            <CountdownText until={endTime} />
          </div>
        </div>
        <div className="border flex gap-x-2 px-2 rounded-md bg-red-800/20 text-red-500 font-semibold">
          <span>{format(endTime, "d MMMM,yyyy")}</span>
          <span>{format(endTime, "p")}</span>
        </div>
      </div>
    </div>
  );
}

interface RunningExamProps {
  endTime: Date;
  title: string;
  exam_id?: string;
  questions: Question[];
  sendEvent: (type: string, payload: unknown) => void;
  isConnected: boolean;
}

function RunningExam({
  endTime,
  title,
  questions,
  sendEvent,
  isConnected,
  exam_id,
}: RunningExamProps) {
  const { selectedAnswers, selectAnswer, clearAnswers } = useRunningExamAnswers(
    questions,
    exam_id,
  );
  const navigate = useNavigate();

  const submitExam = () => {
    if (!isConnected) {
      alert("Cannot submit exam: not connected to server.");
      return;
    }

    sendEvent("submit_exam", {
      exam_id,
      answers: selectedAnswers,
      time: new Date(),
    });

    clearAnswers();
    navigate(`/submissions/${exam_id}`);
  };

  return (
    <div className="h-screen w-[800px] flex flex-col gap-4 py-4">
      <RunningExamHeader submitExam={submitExam} endTime={endTime} title={title} />
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-3 pb-6">
          {questions.map((q, idx) => (
            <ExamQuestionCard
              key={q.question_id}
              question={q}
              position={idx + 1}
              selected={selectedAnswers[q.question_id] || ""}
              selectAnswer={selectAnswer}
            />
          ))}
          <div className="flex justify-center">
            <Badge className="bg-blue-600/20 text-blue-500">End of Questions</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RunningExam;

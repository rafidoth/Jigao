import type { Exam, ExamAction } from "./types";

export function isUpcoming(exam: Exam, now = new Date()): boolean {
  return new Date(exam.start_time).getTime() > now.getTime();
}

export function isRunning(exam: Exam, now = new Date()): boolean {
  const start = new Date(exam.start_time).getTime();
  const end = new Date(exam.end_time).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}

export function isEnded(exam: Exam, now = new Date()): boolean {
  return new Date(exam.end_time).getTime() < now.getTime();
}

export function getExamAction(exam: Exam): ExamAction {
  if (isRunning(exam) || isUpcoming(exam))
    return { label: "Open", to: `/exam/${exam.id}` };
  if (isEnded(exam))
    return { label: "See result", to: `/submissions/${exam.id}` };
  return null;
}

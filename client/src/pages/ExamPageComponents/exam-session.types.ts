export type ExamSessionStatus = "waiting" | "live" | "finished";
export type ExamUIStatus = "waiting" | "running" | "ended";

export type ExamRole = "participant" | "controller";

export type JoinExamResponse = {
  exam_id: string;
  role: ExamRole;
  status: ExamSessionStatus;
  start_time: string;
  end_time: string;
};

export type OnJoinRoomPayload = {
  examStatus: "waiting" | "running" | "ended";
  time?: string;
  title: string;
  role: ExamRole;
};

export type ExamStartsNowPayload = { end_time: string };
export type ExamEndsNowPayload = { end_time: string };
export type SubmitAcceptedPayload = { exam_id: string; submitted_at: string };
export type SocketErrorPayload = { message: string; code?: string };

export type SocketMessage =
  | { type: "on-join-room"; payload: OnJoinRoomPayload }
  | { type: "exam-starts-now"; payload: ExamStartsNowPayload }
  | { type: "exam-ends-now"; payload: ExamEndsNowPayload }
  | { type: "submit-accepted"; payload: SubmitAcceptedPayload }
  | { type: "error"; payload: SocketErrorPayload }
  | { type: string; payload?: unknown };

export function toExamUIStatus(status: ExamSessionStatus): ExamUIStatus {
  if (status === "live") return "running";
  if (status === "finished") return "ended";
  return "waiting";
}

export function isJoinExamResponse(v: unknown): v is JoinExamResponse {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return (
    typeof x.exam_id === "string" &&
    (x.role === "participant" || x.role === "controller") &&
    (x.status === "waiting" || x.status === "live" || x.status === "finished") &&
    typeof x.start_time === "string" &&
    typeof x.end_time === "string"
  );
}

export function getWsUrl(examId: string, role: ExamRole): string {
  return `ws://localhost:5555/api/v1/xmws/?exam_id=${encodeURIComponent(examId)}&role=${encodeURIComponent(role)}`;
}

export function isSubmitAcceptedMessage(v: unknown): v is {
  type: "submit-accepted";
  payload: SubmitAcceptedPayload;
} {
  if (!v || typeof v !== "object") return false;
  const msg = v as Record<string, unknown>;
  if (msg.type !== "submit-accepted") return false;
  if (!msg.payload || typeof msg.payload !== "object") return false;
  const p = msg.payload as Record<string, unknown>;
  return typeof p.exam_id === "string" && typeof p.submitted_at === "string";
}

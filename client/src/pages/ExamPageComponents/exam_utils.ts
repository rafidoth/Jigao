
import type {
    ExamRole,
    ExamSessionStatus,
    ExamUIStatus,
    JoinExamResponse,
    SubmitAcceptedPayload,
} from "./exam-session.types";

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

// Server → Client Message Types
export const MSG_ON_JOIN_ROOM = "on-join-room" as const;
export const MSG_EXAM_STARTS_NOW = "exam-starts-now" as const;
export const MSG_EXAM_ENDS_NOW = "exam-ends-now" as const;
export const MSG_PARTICIPANT_JOINED = "participant-joined" as const;
export const MSG_PARTICIPANT_LEFT = "participant-left" as const;
export const MSG_VIOLATION_ALERT = "violation-alert" as const;
export const MSG_CAMERA_UPDATE = "camera-update" as const;
export const MSG_WARNING_RECEIVED = "warning-received" as const;
export const MSG_KICKED = "kicked" as const;
export const MSG_ANSWER_SAVED = "answer-saved" as const;
export const MSG_SUBMIT_ACCEPTED = "submit-accepted" as const;
export const MSG_ROOM_STATE = "room-state" as const;
export const MSG_SERVER_SHUTDOWN = "server-shutdown" as const;
export const MSG_ERROR = "error" as const;

// Client → Server Message Types
export const MSG_ANSWER_UPDATE = "answer_update" as const;
export const MSG_SUBMIT_EXAM = "submit_exam" as const;
export const MSG_VIOLATION_REPORT = "violation_report" as const;
export const MSG_CAMERA_STATUS = "camera_status" as const;
export const MSG_CAMERA_SNAPSHOT = "camera_snapshot" as const;

// Session Status Values
export const STATUS_WAITING = "waiting" as const;
export const STATUS_LIVE = "live" as const;
export const STATUS_FINISHED = "finished" as const;

// Role Values
export const ROLE_PARTICIPANT = "participant" as const;
export const ROLE_CONTROLLER = "controller" as const;

// WebSocket Configuration
export const WS_RECONNECT_ATTEMPTS = 5;
export const WS_RECONNECT_INTERVAL = 1500;

// Answer Sync Configuration
export const ANSWER_SYNC_DEBOUNCE_MS = 500;

// Local Storage Keys
export const getAnswersStorageKey = (examId: string) => `exam-${examId}-answers`;

export function getWsUrl(examId: string, role: string): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    console.log("protocol used ", protocol)
    const host = "localhost:5555"
    return `${protocol}//${host}/api/v1/xmws?exam_id=${encodeURIComponent(examId)}&role=${encodeURIComponent(role)}`;
}

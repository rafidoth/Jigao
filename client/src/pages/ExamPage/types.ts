import type { Question } from "@/types/questions";

export type ExamPhase =
    | "loading" // Fetching exam details
    | "gate" // Showing join button
    | "joining" // POST /join in progress
    | "lobby" // Waiting for exam to start
    | "running" // Exam in progress
    | "ended" // Exam finished
    | "kicked" // Participant removed
    | "error"; // Unrecoverable error


export type ExamVisibility = "friendly" | "protected" | "public";

// Map API visibility strings to internal visibility type
export function toExamVisibility(apiVisibility?: string): ExamVisibility {
    if (apiVisibility === "public") return "public";
    if (apiVisibility === "restricted") return "protected";
    return "friendly"; // private -> friendly
}


export type SessionStatus = "waiting" | "live" | "finished" | "running" | "ended";

export function sessionStatusToPhase(status: SessionStatus): ExamPhase {
    switch (status) {
        case "waiting":
            return "lobby";
        case "live":
        case "running":
            return "running";
        case "finished":
        case "ended":
            return "ended";
        default:
            return "error";
    }
}


export type ExamRole = "participant" | "controller";


export interface ExamDetailsResponse {
    id: string;
    title: string;
    description: string;
    visibility: string;
    start_time: string;
    end_time: string;
    duration: number;
    session_status: string;
}

export interface JoinExamResponse {
    exam_id: string;
    role: ExamRole;
    status: SessionStatus;
    start_time: string;
    end_time: string;
}

export type ServerMessageType =
    | "on-join-room"
    | "exam-starts-now"
    | "exam-ends-now"
    | "participant-joined"
    | "participant-left"
    | "violation-alert"
    | "camera-update"
    | "warning-received"
    | "kicked"
    | "answer-saved"
    | "submit-accepted"
    | "room-state"
    | "server-shutdown"
    | "error";


export type ClientMessageType =
    | "answer_update"
    | "submit_exam"
    | "violation_report"
    | "camera_status"
    | "camera_snapshot";

// Server to Client Payloads
export interface OnJoinRoomPayload {
    examStatus: SessionStatus;
    time?: string; // ISO8601 - start_time if waiting, end_time if running
    title: string;
    role: ExamRole;
    participants: string[];
}

export interface ExamStartsPayload {
    end_time: string;
}

export interface ExamEndsPayload {
    end_time: string;
}

export interface ParticipantEventPayload {
    user_id: string;
}

export interface ViolationAlertPayload {
    user_id: string;
    violation_type: string;
    violation_count: number;
}

export interface CameraUpdatePayload {
    user_id: string;
    active: boolean;
}

export interface WarningPayload {
    message: string;
    from?: string;
}

export interface KickedPayload {
    reason?: string;
}

export interface AnswerSavedPayload {
    saved_count: number;
    question_ids: string[];
}

export interface SubmitAcceptedPayload {
    exam_id: string;
    submitted_at: string;
}

export interface RoomStatePayload {
    exam_status: SessionStatus;
    start_time?: string;
    end_time?: string;
    participants: ParticipantSnapshot[];
}

export interface ParticipantSnapshot {
    user_id: string;
    status: string;
    camera_active: boolean;
    violation_count: number;
    is_online: boolean;
}

export interface ServerShutdownPayload {
    message: string;
}

export interface SocketErrorPayload {
    message: string;
    code?: string;
}

// Client to Server Payloads
export interface AnswerUpdatePayload {
    answers: Record<string, string>;
}

export interface SubmitExamPayload {
    exam_id: string;
    answers: Record<string, string>;
}

export interface ViolationReportPayload {
    type: string;
    details?: Record<string, unknown>;
}

export interface CameraStatusPayload {
    active: boolean;
}

export type SocketMessage =
    | { type: "on-join-room"; payload: OnJoinRoomPayload }
    | { type: "exam-starts-now"; payload: ExamStartsPayload }
    | { type: "exam-ends-now"; payload: ExamEndsPayload }
    | { type: "participant-joined"; payload: ParticipantEventPayload }
    | { type: "participant-left"; payload: ParticipantEventPayload }
    | { type: "violation-alert"; payload: ViolationAlertPayload }
    | { type: "camera-update"; payload: CameraUpdatePayload }
    | { type: "warning-received"; payload: WarningPayload }
    | { type: "kicked"; payload: KickedPayload }
    | { type: "answer-saved"; payload: AnswerSavedPayload }
    | { type: "submit-accepted"; payload: SubmitAcceptedPayload }
    | { type: "room-state"; payload: RoomStatePayload }
    | { type: "server-shutdown"; payload: ServerShutdownPayload }
    | { type: "error"; payload: SocketErrorPayload };

// Store Types
export interface Warning {
    message: string;
    from?: string;
    timestamp: Date;
}

export interface ExamState {
    // Phase state machine
    phase: ExamPhase;
    errorMessage: string | null;

    // Exam identity
    examId: string | null;
    visibility: ExamVisibility;
    title: string;
    description: string;
    duration: number;
    startTime: Date | null;
    endTime: Date | null;

    // Session state
    role: ExamRole | null;
    isConnected: boolean;
    socketSender: ((type: string, payload: unknown) => void) | null;

    // Participant state
    warnings: Warning[];
    kickReason: string | null;

    // Answers
    answers: Record<string, string>;
    pendingSyncs: Set<string>;

    // Questions
    questions: Question[];
}

export interface ExamActions {
    // Initialization
    loadExamDetails: (examId: string) => Promise<void>;
    joinExam: () => Promise<void>;
    reset: () => void;

    // Connection
    setConnected: (connected: boolean) => void;
    setSocketSender: (sender: ((type: string, payload: unknown) => void) | null) => void;
    sendSocketMessage: (type: string, payload: unknown) => void;

    // Socket message handling
    handleSocketMessage: (msg: SocketMessage) => void;

    // Answers
    setAnswer: (questionId: string, answer: string) => void;
    markAnswerSynced: (questionId: string) => void;
    loadAnswersFromStorage: () => void;

    // Questions
    setQuestions: (questions: Question[]) => void;

    // Submit
    setSubmitted: () => void;
}

export type ExamStore = ExamState & ExamActions;

export type ExamSessionStatus = "waiting" | "live" | "finished";
export type ExamUIStatus = "waiting" | "running" | "ended";

export type ExamRole = "participant" | "controller";

export type ServerToClientMessageType =
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

export type JoinExamResponse = {
    exam_id: string;
    role: ExamRole;
    status: ExamSessionStatus;
    start_time: string;
    end_time: string;
};

export type OnJoinRoomPayload = {
    examStatus: ExamSessionStatus;
    time?: string;
    title: string;
    role: ExamRole;
};

export type ExamStartsNowPayload = { end_time: string };
export type ExamEndsNowPayload = { end_time: string };
export type ParticipantEventPayload = { user_id: string };
export type ViolationAlertPayload = {
    user_id: string;
    violation_type: string;
    violation_count: number;
};
export type CameraUpdatePayload = { user_id: string; active: boolean };
export type WarningReceivedPayload = { message: string; from?: string };
export type KickedPayload = { reason?: string };
export type AnswerSavedPayload = { question_id: string };
export type SubmitAcceptedPayload = { exam_id: string; submitted_at: string };
export type ParticipantSnapshot = {
    user_id: string;
    status: string;
    camera_active: boolean;
    violation_count: number;
    is_online: boolean;
};
export type RoomStatePayload = {
    exam_status: ExamSessionStatus;
    start_time?: string;
    end_time?: string;
    participants: ParticipantSnapshot[];
};
export type ServerShutdownPayload = { message: string };
export type SocketErrorPayload = { message: string; code?: string };

export type SocketMessage =
    | { type: "on-join-room"; payload: OnJoinRoomPayload }
    | { type: "exam-starts-now"; payload: ExamStartsNowPayload }
    | { type: "exam-ends-now"; payload: ExamEndsNowPayload }
    | { type: "participant-joined"; payload: ParticipantEventPayload }
    | { type: "participant-left"; payload: ParticipantEventPayload }
    | { type: "violation-alert"; payload: ViolationAlertPayload }
    | { type: "camera-update"; payload: CameraUpdatePayload }
    | { type: "warning-received"; payload: WarningReceivedPayload }
    | { type: "kicked"; payload: KickedPayload }
    | { type: "answer-saved"; payload: AnswerSavedPayload }
    | { type: "submit-accepted"; payload: SubmitAcceptedPayload }
    | { type: "room-state"; payload: RoomStatePayload }
    | { type: "server-shutdown"; payload: ServerShutdownPayload }
    | { type: "error"; payload: SocketErrorPayload }
    | { type: string; payload?: unknown };

export type ServerToClientMessage = Extract<
    SocketMessage,
    { type: ServerToClientMessageType }
>;


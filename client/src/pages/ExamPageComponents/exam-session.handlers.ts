import { toExamUIStatus } from "./exam_utils";
import type { ExamUIStatus, SocketMessage } from "./exam-session.types";

export type ExamSocketStateUpdate = {
    title?: string;
    examStatus?: ExamUIStatus;
    startTime?: Date;
    endTime?: Date;
};

function toValidDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;

    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) return undefined;

    return dateValue;
}

function logPayload(messageType: string, payload: unknown): void {
    console.log(`[exam-ws] ${messageType}`, payload);
}

export function getExamSocketStateUpdate(
    socketMessage: SocketMessage,
    currentTitle: string,
): ExamSocketStateUpdate | null {
    switch (socketMessage.type) {
        case "on-join-room": {
            logPayload(socketMessage.type, socketMessage.payload);
            const nextExamStatus = toExamUIStatus(socketMessage.payload.examStatus);
            const timeValue = toValidDate(socketMessage.payload.time);

            return {
                title: socketMessage.payload.title || currentTitle,
                examStatus: nextExamStatus,
                startTime: nextExamStatus === "waiting" ? timeValue : undefined,
                endTime: nextExamStatus !== "waiting" ? timeValue : undefined,
            };
        }

        case "exam-starts-now": {
            logPayload(socketMessage.type, socketMessage.payload);
            return {
                examStatus: "running",
                endTime: toValidDate(socketMessage.payload?.end_time),
            };
        }

        case "exam-ends-now": {
            logPayload(socketMessage.type, socketMessage.payload);
            return {
                examStatus: "ended",
                endTime: toValidDate(socketMessage.payload.end_time),
            };
        }

        case "participant-joined":
        case "participant-left":
        case "violation-alert":
        case "camera-update":
        case "warning-received":
        case "kicked":
        case "answer-saved":
        case "submit-accepted":
        case "room-state":
        case "server-shutdown":
        case "error": {
            logPayload(socketMessage.type, socketMessage.payload);
            if (!socketMessage.payload) {
                return null
            }
            return null;
        }

        default: {
            return null;
        }
    }
}

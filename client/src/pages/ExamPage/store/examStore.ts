import { create } from "zustand";

import { getExamById, getQuestionsByExamId, joinExam } from "@/api/query";
import type { Question } from "@/types/questions";

import { getAnswersStorageKey } from "../constants";
import type {
    ExamDetailsResponse,
    ExamPhase,
    ExamStore,
    ExamVisibility,
    JoinExamResponse,
    SocketMessage,
    Warning,
} from "../types";
import { sessionStatusToPhase, toExamVisibility } from "../types";

const initialState = {
    phase: "loading" as ExamPhase,
    errorMessage: null,

    examId: null,
    visibility: "friendly" as ExamVisibility,
    title: "",
    description: "",
    duration: 0,
    startTime: null,
    endTime: null,

    role: null,
    isConnected: false,
    socketSender: null,

    warnings: [] as Warning[],
    kickReason: null,

    answers: {} as Record<string, string>,
    pendingSyncs: new Set<string>(),

    questions: [] as Question[],
};


export const useExamStore = create<ExamStore>((set, get) => ({
    ...initialState,

    // Load exam details from API
    loadExamDetails: async (examId: string) => {
        // Reset if switching exams
        if (get().examId !== examId) {
            set({ ...initialState, phase: "loading", examId });
        }

        try {
            const data: ExamDetailsResponse = await getExamById(examId);

            set({
                examId: data.id,
                title: data.title,
                description: data.description,
                visibility: toExamVisibility(data.visibility),
                startTime: new Date(data.start_time),
                endTime: new Date(data.end_time),
                duration: data.duration,
                phase: "gate",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load exam details";
            set({ phase: "error", errorMessage: message });
        }
    },

    // Join exam via API
    joinExam: async () => {
        const { examId } = get();
        if (!examId) {
            set({ phase: "error", errorMessage: "No exam ID" });
            return;
        }

        set({ phase: "joining" });

        try {
            const data: JoinExamResponse = await joinExam(examId);

            // Determine initial phase based on exam status
            const nextPhase = sessionStatusToPhase(data.status);

            set({
                role: data.role,
                startTime: new Date(data.start_time),
                endTime: new Date(data.end_time),
                phase: nextPhase,
            });

            // Load answers from localStorage if resuming
            get().loadAnswersFromStorage();
        } catch (error: unknown) {
            // Check for 403 forbidden
            if (
                error &&
                typeof error === "object" &&
                "response" in error &&
                (error as { response?: { status?: number } }).response?.status === 403
            ) {
                set({ phase: "error", errorMessage: "You are not allowed to join this exam" });
                return;
            }

            const message = error instanceof Error ? error.message : "Failed to join exam";
            set({ phase: "error", errorMessage: message });
        }
    },

    // Reset store
    reset: () => {
        set({ ...initialState });
    },

    // Connection status
    setConnected: (connected: boolean) => {
        set({ isConnected: connected });
    },

    setSocketSender: (sender) => {
        set({ socketSender: sender });
    },

    sendSocketMessage: (type: string, payload: unknown) => {
        const sender = get().socketSender;
        if (!sender) {
            console.warn("Cannot send message: WebSocket sender unavailable");
            return;
        }
        sender(type, payload);
    },

    // Handle socket messages
    handleSocketMessage: (msg: SocketMessage) => {
        const state = get();

        switch (msg.type) {
            case "on-join-room": {
                const { examStatus, time, title } = msg.payload;
                const nextPhase = sessionStatusToPhase(examStatus);
                const updates: Partial<typeof state> = {
                    phase: nextPhase,
                    title: title || state.title,
                };

                // Parse time based on status
                if (time) {
                    const date = new Date(time);
                    if (!Number.isNaN(date.getTime())) {
                        if (examStatus === "waiting") {
                            updates.startTime = date;
                        } else {
                            updates.endTime = date;
                        }
                    }
                }

                if (nextPhase === "running") {
                    if (state.examId) {
                        getQuestionsByExamId(state.examId)
                            .then((questions) => {
                                set({ questions });
                            })
                            .catch((err) => {
                                console.error("Failed to fetch questions:", err);
                            });
                    }
                }

                set(updates);
                break;
            }

            case "exam-starts-now": {
                const endTime = msg.payload.end_time ? new Date(msg.payload.end_time) : state.endTime;
                set({ phase: "running", endTime });

                // Fetch questions when exam starts
                if (state.examId) {
                    getQuestionsByExamId(state.examId)
                        .then((questions) => {
                            set({ questions });
                        })
                        .catch((err) => {
                            console.error("Failed to fetch questions:", err);
                        });
                }
                break;
            }

            case "exam-ends-now": {
                const endTime = msg.payload.end_time ? new Date(msg.payload.end_time) : state.endTime;
                set({ phase: "ended", endTime });
                break;
            }

            case "warning-received": {
                const warning: Warning = {
                    message: msg.payload.message,
                    from: msg.payload.from,
                    timestamp: new Date(),
                };
                set({ warnings: [...state.warnings, warning] });
                break;
            }

            case "kicked": {
                set({
                    phase: "kicked",
                    kickReason: msg.payload.reason || "You have been removed from this exam",
                });
                break;
            }

            case "answer-saved": {
                // Remove from pending syncs
                const { pendingSyncs } = state;
                const next = new Set(pendingSyncs);
                next.delete(msg.payload.question_id);
                set({ pendingSyncs: next });
                break;
            }

            case "submit-accepted": {
                set({ phase: "ended" });
                // Clear localStorage answers
                if (state.examId) {
                    localStorage.removeItem(getAnswersStorageKey(state.examId));
                }
                break;
            }

            case "server-shutdown": {
                console.warn("Server shutdown:", msg.payload.message);
                // Don't change phase, let reconnection handle it
                break;
            }

            case "error": {
                console.error("Socket error:", msg.payload);
                // Don't change phase for recoverable errors
                break;
            }

            // Participant events are mainly for controllers, ignore for now
            case "participant-joined":
            case "participant-left":
            case "violation-alert":
            case "camera-update":
            case "room-state":
                break;
        }
    },

    // Answer management
    setAnswer: (questionId: string, answer: string) => {
        const { answers, pendingSyncs, examId } = get();

        const nextAnswers = { ...answers, [questionId]: answer };
        const nextPending = new Set(pendingSyncs);
        nextPending.add(questionId);

        set({ answers: nextAnswers, pendingSyncs: nextPending });

        // Persist to localStorage
        if (examId) {
            localStorage.setItem(getAnswersStorageKey(examId), JSON.stringify(nextAnswers));
        }
    },

    markAnswerSynced: (questionId: string) => {
        const { pendingSyncs } = get();
        const next = new Set(pendingSyncs);
        next.delete(questionId);
        set({ pendingSyncs: next });
    },

    loadAnswersFromStorage: () => {
        const { examId } = get();
        if (!examId) return;

        try {
            const stored = localStorage.getItem(getAnswersStorageKey(examId));
            if (stored) {
                const answers = JSON.parse(stored);
                if (typeof answers === "object" && answers !== null) {
                    set({ answers });
                }
            }
        } catch (e) {
            console.warn("Failed to load answers from storage:", e);
        }
    },

    // Questions
    setQuestions: (questions: Question[]) => {
        set({ questions });
    },

    // Submit
    setSubmitted: () => {
        const { examId } = get();
        set({ phase: "ended" });

        // Clear localStorage
        if (examId) {
            localStorage.removeItem(getAnswersStorageKey(examId));
        }
    },
}));

// Selectors (for render isolation)
export const useExamPhase = () => useExamStore((s) => s.phase);
export const useExamId = () => useExamStore((s) => s.examId);
export const useExamTitle = () => useExamStore((s) => s.title);
export const useExamDescription = () => useExamStore((s) => s.description);
export const useExamVisibility = () => useExamStore((s) => s.visibility);
export const useExamDuration = () => useExamStore((s) => s.duration);
export const useStartTime = () => useExamStore((s) => s.startTime);
export const useEndTime = () => useExamStore((s) => s.endTime);
export const useExamRole = () => useExamStore((s) => s.role);
export const useIsConnected = () => useExamStore((s) => s.isConnected);
export const useSendSocketMessage = () => useExamStore((s) => s.sendSocketMessage);
export const useWarnings = () => useExamStore((s) => s.warnings);
export const useKickReason = () => useExamStore((s) => s.kickReason);
export const useAnswers = () => useExamStore((s) => s.answers);
export const usePendingSyncs = () => useExamStore((s) => s.pendingSyncs);
export const useQuestions = () => useExamStore((s) => s.questions);
export const useErrorMessage = () => useExamStore((s) => s.errorMessage);

// Composite selectors
export const useExamDetails = () =>
    useExamStore((s) => ({
        title: s.title,
        description: s.description,
        visibility: s.visibility,
        duration: s.duration,
        startTime: s.startTime,
        endTime: s.endTime,
    }));

// Actions 
export const useExamActions = () =>
    useExamStore((s) => ({
        loadExamDetails: s.loadExamDetails,
        joinExam: s.joinExam,
        reset: s.reset,
        setConnected: s.setConnected,
        handleSocketMessage: s.handleSocketMessage,
        setAnswer: s.setAnswer,
        markAnswerSynced: s.markAnswerSynced,
        setQuestions: s.setQuestions,
        setSubmitted: s.setSubmitted,
    }));

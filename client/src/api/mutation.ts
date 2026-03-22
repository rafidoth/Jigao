import type { Difficulty, QuestionKind } from "@/types/questions";
import { buildCreateQuestionPayload } from "@/components/create_new_question_popover/utils";

import { api } from "./client";
interface User {
    id: string;
    name: string | null;
    email: string | null;
    image_url: string | null;
}

export const createNewSetPost = async () => {
    const res = await api.post(`/api/v1/sets`);
    return res.data;
};

export const userOnLogin = async (user: User) => {
    const res = await api.post(`/api/v1/users`, user);
    return res.data;
};

interface CreateQuestionVariables {
    set_id: string;
    difficulty: Difficulty;
    questionType: QuestionKind;
    questionText: string;
    choices: string[];
    correctAnswerIndex: number;
    correctAnswerText: string;
    explanation: string;
}

export const createNewQuestionApiPost = async (
    variables: CreateQuestionVariables,
) => {
    const body = buildCreateQuestionPayload(variables);
    const res = await api.post(`/api/v1/questions?set_id=${variables.set_id}`, body);
    return res.data;
};

type Visibility = "public" | "private" | "restricted";

interface UpdateSetSettingsVariables {
    set_id: string | number;
    title: string;
    visibility: Visibility;
}

export const updateSetSettings = async (variables: UpdateSetSettingsVariables) => {
    const { set_id, title, visibility } = variables;
    const body = { title, visibility };
    const res = await api.put(`/api/v1/sets/${set_id}`, body);
    return res.data;
};

interface CreateExamVariables {
    set_id: string;
    title: string;
    description: string;
    start_time_iso: string;
    duration_in_minutes: number;
    visibility: Visibility;
    start_mode: "lobby" | "timed";
    proctoring_enabled: boolean;
    camera_required: boolean;
}

export const createExamApiPost = async (variables: CreateExamVariables) => {
    const {
        set_id,
        title,
        description,
        start_time_iso,
        duration_in_minutes,
        visibility,
        start_mode,
        proctoring_enabled,
        camera_required,
    } = variables;
    const body = {
        set_id,
        title,
        description,
        start_time: start_time_iso,
        duration_in_minutes,
        visibility,
        start_mode,
        proctoring_enabled,
        camera_required,
    };
    const res = await api.post("/api/v1/exams", body);
    return res.data;
};

export const deleteExamApi = async (exam_id: string) => {
    await api.delete(`/api/v1/exams/${exam_id}`);
    return { exam_id };
};

export const addUserToAccessList = async ({
    setId,
    userId,
}: {
    setId: string | number;
    userId: string | number;
}) => {
    await api.post(`/api/v1/sets/access`, {
        user_id: userId,
        set_id: setId,
    });
};

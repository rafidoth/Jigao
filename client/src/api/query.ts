import type { Exam } from "@/features/exams/types";
import type { User as AccessUser } from "@/components/add_people_access_popover/types";
import type {
    SetListApiResponse,
    SetVisibilityFilter,
} from "@/pages/set_list/types";
import { api } from "./client";


interface GetSetsPageParams {
    createdBy?: string;
    visibility?: SetVisibilityFilter;
    lastSeenId?: string | null;
}

export const getSetsPage = async (
    params: GetSetsPageParams = {},
): Promise<SetListApiResponse> => {
    const queryParams: Record<string, string> = {};
    const createdBy = params.createdBy?.trim() ?? "";
    const visibility = params.visibility?.trim() ?? "";
    const lastSeenId = params.lastSeenId?.trim() ?? "";

    if (createdBy) {
        queryParams.created_by = createdBy;
    }

    if (visibility && visibility !== "all") {
        queryParams.visibility = visibility;
    }

    if (lastSeenId) {
        queryParams.last_seen_id = lastSeenId;
    }

    const res = await api.get(`/api/v1/sets/`, { params: queryParams });
    return res.data as SetListApiResponse;
};

export const getRecentSets = async () => {
    const res = await getSetsPage();
    return res.sets;
};

export const getUsersWithAccess = async (setId: string | number) => {
    const res = await api.get(`/api/v1/sets/access_list/${setId}`);
    return res.data;
};

export const getQuestions = async (set_id: string) => {
    const res = await api.get(`/api/v1/questions?set_id=${set_id}`);
    return res.data;
};

export const getSet = async (set_id: string) => {
    const res = await api.get(`/api/v1/sets/${set_id}`);
    return res.data;
};

export const getQuestionsByExamId = async (exam_id: string | undefined) => {
    const res = await api.get(`/api/v1/exams/q/${exam_id}`);
    return res.data;
};

export const getExamById = async (exam_id: string | undefined) => {
    const res = await api.get(`/api/v1/exams/${exam_id}`);
    return res.data;
};

export const joinExam = async (exam_id: string) => {
    const res = await api.post(`/api/v1/exams/join`, null, { params: { exam_id } });
    return res.data;
};

export const fetchExamsApi = async (set_id: string) => {
    const res = await api.get("/api/v1/exams", { params: { set_id } });
    return res.data;
};

export const getExams = async (): Promise<Exam[]> => {
    const res = await api.get(`/api/v1/exams`);
    return res.data as Exam[];
};

export const getUserFromEmail = async (email: string): Promise<AccessUser> => {
    const res = await api.get(
        `/api/v1/users/user?email=${encodeURIComponent(email)}`,
    );
    return res.data;
};

export const getSubmissionByExamId = async (examId: string | undefined) => {
    const res = await api.get(`/api/v1/submissions/${examId}`);
    return res.data;
};

export const getSelfTestResult = async (selfTestId: string) => {
    const res = await api.get(`/api/v1/self-tests/result/${selfTestId}`);
    return res.data;
};

export const fetchRecentSelfTests = async (set_id: string) => {
    const res = await api.get(`/api/v1/self-tests`, { params: { set_id } });
    return res.data;
};

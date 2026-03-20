import axios from "axios";

interface CreateExamVariables {
    set_id: string;
    title: string;
    description: string;
    start_time_iso: string;
    duration_in_minutes: number;
    start_mode: "lobby" | "timed";
    proctoring_enabled: boolean;
    camera_required: boolean;
}

export async function createExamApiPost(variables: CreateExamVariables) {
    const {
        set_id,
        title,
        description,
        start_time_iso,
        duration_in_minutes,
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
        start_mode,
        proctoring_enabled,
        camera_required,
    };
    console.log(body)
    const res = await axios.post("/api/v1/exams", body);
    return res.data;
}

export async function fetchExamsApi(set_id: string) {
    const res = await axios.get("/api/v1/exams", { params: { set_id } });
    return res.data;
}

export async function deleteExamApi(exam_id: string) {
    await axios.delete(`/api/v1/exams/${exam_id}`);
    return { exam_id };
}

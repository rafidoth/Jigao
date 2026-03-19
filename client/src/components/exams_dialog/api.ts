import axios from "axios";

interface CreateExamVariables {
  set_id: string;
  title: string;
  description: string;
  start_time_iso: string;
  duration_in_minutes: number;
}

export async function createExamApiPost(variables: CreateExamVariables) {
  const { set_id, title, description, start_time_iso, duration_in_minutes } =
    variables;
  const body = {
    set_id,
    title,
    description,
    start_time: start_time_iso,
    duration_in_minutes,
  };
  const res = await axios.post("http://localhost:9999/api/v1/exams", body);
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

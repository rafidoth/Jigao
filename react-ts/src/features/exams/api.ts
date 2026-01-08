import axios from "axios";
import type { Exam } from "./types";

export async function getExams(): Promise<Exam[]> {
  const res = await axios.get(`/api/v1/exams`);
  return res.data as Exam[];
}

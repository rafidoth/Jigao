import { ai_api } from "@/utils/axios_utils";
export const generateQuestions = async (data: {
  difficultyLevel: string;
  questionQuantity: number;
  questionTypes: string[];
  context: string;
}) => {
  const res = await ai_api.post(`/api/chat`, data);
  return res.data;
};

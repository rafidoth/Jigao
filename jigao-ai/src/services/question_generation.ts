import getQuestionGenerationChain from "../chains/questionGenerationChain.js";
import type { ExpectedLlmResponse } from "../chains/schema.js";
import { saveQuestions } from "../utils/axios.js";

type QuestionGenerationParams = {
  questionQuantity: number;
  questionType: string;
  difficultyLevel: string;
  context: string;
  token: string;
};
async function generateQuestion(
  params: QuestionGenerationParams,
): Promise<string> {
  const generationChain = await getQuestionGenerationChain();
  const result: ExpectedLlmResponse = await generationChain.invoke({
    n: params.questionQuantity,
    question_type: params.questionType,
    difficulty: params.difficultyLevel,
    context: params.context,
  });

  const saveQuestionsResponse = await saveQuestions(result, params.token || "");
  return saveQuestionsResponse.set_id;
}

export { generateQuestion };

import { HumanMessage, SystemMessage } from "langchain";
import getQuestionGenerationAgent from "../chains/questionGenerationChain.js";
import type { ExpectedLlmResponse } from "../chains/schema.js";
import { saveQuestions } from "../utils/axios.js";
import { getDifficultyInstructions } from "../chains/utils.js";

type QuestionGenerationParams = {
  questionQuantity: number;
  questionTypes: string[];
  difficultyLevel: string;
  context: string;
  token: string;
};
async function generateQuestion(
  params: QuestionGenerationParams,
): Promise<string> {
  const messages = [
    new SystemMessage("You are a helpful question generation assistant."),
    new HumanMessage(
      `
    Generate ${params.questionQuantity} ${params.difficultyLevel} ${params.questionTypes.join(",")}
    questions. 

    <Difficulty Rules>
    ${getDifficultyInstructions(params.difficultyLevel)}
    </DIfficulty Rules>

     Question Generation Rules on the given context:
    - If the context is just a topic, generate questions based on the topic.
    - If the context is enough to generate questions, generate questions based on the context only.
        
    I'm giving you the context to generate questions.

      `,
    ),
    new HumanMessage(`
    <Generate Questions on This Context>
    ${params.context}
    </Generate Questions on This Context>

    `),
  ];

  const agent = await getQuestionGenerationAgent();
  const result: ExpectedLlmResponse = await agent.invoke(messages);

  const saveQuestionsResponse = await saveQuestions(result, params.token || "");
  console.log("Questions saved with set_id:", saveQuestionsResponse.set_id);
  return saveQuestionsResponse.set_id;
}

export { generateQuestion };

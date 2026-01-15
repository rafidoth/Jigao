import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { LlmExpectedResponseSchema } from "./schema.js";

const getQuestionGenerationChain = async (
  style?: string,
): Promise<RunnableSequence> => {
  const prompt = PromptTemplate.fromTemplate(
    `Generate {n} {difficulty} {question_types}  questions.

    <Difficulty Rules>
    {difficulty_rules}
    </DIfficulty Rules>

     Question Generation Rules on the given context:
    - If the context is just a topic, generate questions based on the topic.
    - If the context is enough to generate questions, generate questions based on the context only.

    <Generate Questions on This Context>
    {context}
    <Generate Questions on This Context>

    ${style ? `Please follow the tone, style and common languages like this : ${style}` : ""}
  `,
  );

  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });
  const structuredLlm = model.withStructuredOutput(LlmExpectedResponseSchema);
  const questionGenerationChain = RunnableSequence.from([
    prompt,
    structuredLlm,
  ]);
  return questionGenerationChain;
};

export default getQuestionGenerationChain;

import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QuestionsSchema } from "../interfaces/questions";
export const makeChain = async ({
  n,
  question_type,
  instructions,
  context,
}: {
  n: number;
  question_type: string;
  instructions: string;
  context: string;
}): Promise<RunnableSequence> => {
  const prompt = PromptTemplate.fromTemplate(
    `Generate {n} {question_type} questions based
        on the given context.
        - If the context is just a topic, generate questions based on the topic.
        - If the context is enough to generate questions, generate questions based on the context only.
        {instructions}
        <Generate Questions on This Context>
        {context}
        <Generate Questions on This Context>
  `,
  );
  const finalPromptString = await prompt.format({
    n,
    question_type,
    instructions,
    context,
  });

  console.log("--- Formatted Prompt String ---");
  console.log(finalPromptString);
  console.log("-------------------------------");

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0,
  });

  const structuredLlm = model.withStructuredOutput(QuestionsSchema);
  const questionGenerationChain = RunnableSequence.from([
    prompt,
    structuredLlm,
  ]);
  return questionGenerationChain;
};

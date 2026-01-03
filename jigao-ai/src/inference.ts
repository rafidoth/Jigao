import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
const InferenceInputSchema = z.object({
  quantity: z.number().min(1).default(5),
  question_type: z
    .enum([
      "multiple_choice_questions",
      "fill_in_the_blanks",
      "short_question",
      "true_false",
      "mixed",
    ])
    .default("mixed"),
  context: z.string().min(1),
  instructions: z.string().optional().default(""),
  style: z.string().optional().default(""),
});
type InferredRequest = z.infer<typeof InferenceInputSchema>;

async function InferenceFunction() {
  const inferencePrompt = PromptTemplate.fromTemplate(`
You are an intent extraction system.

Extract the following from the user's input:
- quantity (number of questions)
- question_type (e.g., MCQ, short answer, conceptual, scenario-based)
- context or topic (main subject to generate questions from)
- instructions (constraints like difficulty, syllabus, exam type)
- style (optional: academic, competitive exam, casual, board-exam)

User input:
{user_input}
`);

  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });
  const structuredLlm = model.withStructuredOutput(InferenceInputSchema);
  const questionGenerationChain = RunnableSequence.from([
    inferencePrompt,
    structuredLlm,
  ]);
  return questionGenerationChain;
}
export default InferenceFunction;

export const InferUserPrompt = async (
  user_prompt: string,
): Promise<InferredRequest> => {
  const inferenceChain = await InferenceFunction();
  const result = await inferenceChain.invoke({
    user_input: user_prompt,
  });
  return result as InferredRequest;
};

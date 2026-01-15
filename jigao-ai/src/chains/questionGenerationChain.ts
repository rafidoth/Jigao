import { ChatGroq } from "@langchain/groq";
import { LlmExpectedResponseSchema } from "./schema.js";

const getQuestionGenerationAgent = async () => {
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });
  // const questionGeneratingAgent = createAgent({
  //   model,
  //   responseFormat: LlmExpectedResponseSchema,
  // });
  const agent = model.withStructuredOutput(LlmExpectedResponseSchema);
  return agent;
};

export default getQuestionGenerationAgent;

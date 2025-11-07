import * as grpc from "@grpc/grpc-js";
import z from "zod";
import { QuestionSchema, ChoiceSchema, QuestionsSchema } from "./questions";

// Request Message Interface
export interface IGenerateQuestionsRequest {
  quantity: number;
  context: string;
  instructions: string;
  question_type: string;
}

// Response Message Interface
export interface IGenerateQuestionsResponse {
  questions: z.Infer<typeof QuestionsSchema>;
  title: string;
}

// Handler Type Definition (Optional, but helpful for strict typing)
export type GenerateQuestionsHandler = grpc.handleUnaryCall<
  IGenerateQuestionsRequest,
  IGenerateQuestionsResponse
>;

export interface JigaoAIService {
  GenerateQuestions: grpc.handleUnaryCall<
    IGenerateQuestionsRequest,
    IGenerateQuestionsResponse
  >;
}

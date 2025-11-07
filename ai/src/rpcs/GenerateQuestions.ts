import * as grpc from "@grpc/grpc-js";
import {
  IGenerateQuestionsRequest,
  IGenerateQuestionsResponse,
} from "../interfaces/grpc";

import { makeChain } from "../service/makeChain";

export default async function generateQuestions(
  call: grpc.ServerUnaryCall<
    IGenerateQuestionsRequest,
    IGenerateQuestionsResponse
  >,
  callback: grpc.sendUnaryData<IGenerateQuestionsResponse>,
) {
  const { quantity, context, instructions, question_type } = call.request;
  console.log("Request came ... questions needed : ", quantity);
  const chain = makeChain({
    n: quantity,
    instructions: instructions,
    context: context,
    question_type: question_type,
  });

  const result = await (
    await chain
  ).invoke({
    n: quantity,
    instructions: instructions,
    context: context,
    question_type: question_type,
  });
  console.log(result);
  const response: IGenerateQuestionsResponse = {
    questions: result.questions,
    title: result.title,
  };

  callback(null, response);
}

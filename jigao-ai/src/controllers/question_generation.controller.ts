import type { Request, Response } from "express";
import {
  badRequestResponse,
  notAuthorizedResponse,
} from "../utils/apiResponses.js";
import { generateQuestion } from "../services/question_generation.js";

export async function generateQuestions(req: Request, res: Response) {
  const { questionQuantity, questionTypes, difficultyLevel, context } =
    req.body;
  if (!questionQuantity || !questionTypes || !difficultyLevel || !context) {
    return badRequestResponse(
      "Missing required fields in the request body.",
      res,
    );
  }

  if (
    req.headers["authorization"] === undefined ||
    req.headers["authorization"] === ""
  ) {
    return notAuthorizedResponse("Authorization token is missing.", res);
  }
  console.log("reached request handler");
  console.log("Request body:", req.body);

  const setId = await generateQuestion({
    questionQuantity,
    questionTypes,
    difficultyLevel,
    context,
    token: req.headers["authorization"] || "",
  });
  console.log("Generated set ID:", setId);
  res.json({
    set_id: setId,
  });
}

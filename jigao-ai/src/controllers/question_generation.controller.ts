import type { Request, Response } from "express";
import {
  badRequestResponse,
  notAuthorizedResponse,
} from "../utils/apiResponses.js";
import { generateQuestion } from "../services/question_generation.js";

export async function generateQuestions(req: Request, res: Response) {
  const { questionQuantity, questionType, difficultyLevel, context } = req.body;
  if (!questionQuantity || !questionType || !difficultyLevel || !context) {
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

  const setId = generateQuestion({
    questionQuantity,
    questionType,
    difficultyLevel,
    context,
    token: req.headers["authorization"] || "",
  });
  res.json({
    set_id: setId,
  });
}

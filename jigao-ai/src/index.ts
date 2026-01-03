import dotenv from "dotenv";
dotenv.config();

import express from "express";
import upload from "./middlewares/multer.middleware.js";
import { styleExtraction } from "./controllers/style_extraction.controller.js";
import cors from "cors";
import InferenceFunction from "./inference.js";
import generate_questions from "./generate_questions.js";
import type { ExpectedLlmResponse } from "./schema.js";
import { saveQuestions } from "./utils/axios.js";
import { warn } from "node:console";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

app.post("/api/style", upload.array("attachments", 5), styleExtraction);

app.post("/api/chat/", upload.array("attachments", 5), async (req, res) => {
  if (req.headers["authorization"] === undefined) {
    warn("Authorization token is missing in the request headers.");
    return res.status(401).json({ error: "Authorization token is missing." });
  }
  const chain = await InferenceFunction();
  const inferenceResult = await chain.invoke({
    user_input: req.body.context,
  });
  const generationChain = await generate_questions(inferenceResult.style);
  const generationResult: ExpectedLlmResponse = await generationChain.invoke({
    n: inferenceResult.quantity ? inferenceResult.quantity : 10,
    question_type: inferenceResult.question_type
      ? inferenceResult.question_type
      : "mixed",
    instructions: inferenceResult.instructions,
    context: inferenceResult.context,
    style: inferenceResult.style,
  });

  const saveQuestionsResponse = await saveQuestions(
    generationResult,
    req.headers["authorization"] || "",
  );
  console.log("Save Questions Response:", saveQuestionsResponse);
  res.json({
    set_id: saveQuestionsResponse.set_id,
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

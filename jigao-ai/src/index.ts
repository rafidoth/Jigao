import dotenv from "dotenv";
dotenv.config();

import express from "express";
import type { Express } from "express";
import upload from "./middlewares/multer.middleware.js";
import cors from "cors";
import InferenceFunction from "./inference.js";
import generate_questions from "./generate_questions.js";
import type { ExpectedLlmResponse } from "./schema.js";
import { saveQuestions } from "./utils/axios.js";
import { warn } from "node:console";
import type { TextResult } from "pdf-parse";
import Router from "./routes/route.js";

const app: Express = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

const router = new Router(app);
const routeBindedServer = router.bindRoutes();

app.post("/api/chat", upload.array("attachments", 5), async (req, res) => {
  console.log("Received /api/chat request");
  if (req.headers["authorization"] === undefined) {
    warn("Authorization token is missing in the request headers.");
    return res.status(401).json({ error: "Authorization token is missing." });
  }

  const files = req.files as Express.Multer.File[];
  let data: TextResult[] = [];
  let pdf_texts: string[] = [];
  console.log("Extracted text from PDFs:", pdf_texts);
  const combined_pdf_text = pdf_texts.join("\n");
  console.log("Combined PDF Text:", combined_pdf_text);

  const chain = await InferenceFunction();
  let inferenceResult;
  if (combined_pdf_text.trim().length > 0) {
    inferenceResult = await chain.invoke({
      user_input: `User Uploaded some/a document which is extracted here ${combined_pdf_text} and also in input field wrote this ${req.body.context}`,
    });
  } else {
    inferenceResult = await chain.invoke({
      user_input: req.body.context,
    });
  }
  console.log("Inference Result:", inferenceResult);

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

routeBindedServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

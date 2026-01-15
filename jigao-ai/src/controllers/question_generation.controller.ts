import type { Request, Response } from "express";

export function generateQuestions(req: Request, res: Response) {
  res.json({ message: "This is a placeholder for question generation." });
}

// app.post("/api/chat", upload.array("attachments", 5), async (req, res) => {
//   console.log("Received /api/chat request");
//   if (req.headers["authorization"] === undefined) {
//     warn("Authorization token is missing in the request headers.");
//     return res.status(401).json({ error: "Authorization token is missing." });
//   }
//
//
//   const chain = await InferenceFunction();
//   let inferenceResult;
//   if (combined_pdf_text.trim().length > 0) {
//     inferenceResult = await chain.invoke({
//       user_input: `User Uploaded some/a document which is extracted here ${combined_pdf_text} and also in input field wrote this ${req.body.context}`,
//     });
//   } else {
//     inferenceResult = await chain.invoke({
//       user_input: req.body.context,
//     });
//   }
//   console.log("Inference Result:", inferenceResult);
//
//   const generationChain = await generate_questions(inferenceResult.style);
//   const generationResult: ExpectedLlmResponse = await generationChain.invoke({
//     n: inferenceResult.quantity ? inferenceResult.quantity : 10,
//     question_type: inferenceResult.question_type
//       ? inferenceResult.question_type
//       : "mixed",
//     instructions: inferenceResult.instructions,
//     context: inferenceResult.context,
//     style: inferenceResult.style,
//   });
//
//   const saveQuestionsResponse = await saveQuestions(
//     generationResult,
//     req.headers["authorization"] || "",
//   );
//   console.log("Save Questions Response:", saveQuestionsResponse);
//   res.json({
//     set_id: saveQuestionsResponse.set_id,
//   });
// });

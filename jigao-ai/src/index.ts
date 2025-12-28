import express from "express";
import upload from "./middlewares/multer.middleware.js";
import { styleExtraction } from "./controllers/style_extraction.controller.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

app.post(
  "/api/style-file-upload",
  upload.array("style_pdf", 2),
  styleExtraction,
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

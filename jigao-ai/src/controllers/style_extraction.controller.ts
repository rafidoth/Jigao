import type { Request, Response } from "express";
import { PDFParse, type TextResult } from "pdf-parse";
const styleExtraction = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }
  const data_promises = files.map((file) => {
    const f = file;
    const buf = f.buffer;
    const parser = new PDFParse({ data: buf });
    return parser.getText();
  });
  const data: TextResult[] = await Promise.all(data_promises || []);
  console.log("Extracted data: ", data);
  res.json({
    message: "Style extraction endpoint hit",
    files: req.files,
    data,
  });
};
export { styleExtraction };

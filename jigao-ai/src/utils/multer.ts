import type { TextResult } from "pdf-parse";
import { PDFParse } from "pdf-parse";

export async function extractTextFromMulterFile(
  files: Express.Multer.File[],
): Promise<TextResult[]> {
  let data: TextResult[] = [];
  if (files && files.length > 0) {
    const data_promises = files.map((file) => {
      const parser = new PDFParse({ data: file.buffer });
      return parser.getText();
    });
    data = await Promise.all(data_promises || []);
  }
  return data;
}

export function extractSingleStringFromTextResults(data: TextResult[]): string {
  const pdf_texts: string[] = data.map((d) => d.text);
  const combined_pdf_text = pdf_texts.join("\n");
  return combined_pdf_text;
}

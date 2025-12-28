import type { Request, Response } from "express";
const styleExtraction = (req: Request, res: Response) => {
  console.log(req.files);
  res.send("Multiple files uploaded!");
};
export { styleExtraction };

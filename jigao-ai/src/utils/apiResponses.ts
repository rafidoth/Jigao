import type { Response } from "express";

export function badRequestResponse(message: string, res: Response) {
  res.status(400).json({ error: message });
}
export function notAuthorizedResponse(message: string, res: Response) {
  res.status(401).json({ error: message });
}

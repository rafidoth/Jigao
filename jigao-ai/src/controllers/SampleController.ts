import type { Request, Response } from 'express';

export class SampleController {
  handleCreate(req: Request, res: Response) {
    const payload = req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const result = {
      id: Math.random().toString(36).slice(2, 10),
      message: 'Item created successfully',
      data: payload,
    };

    return res.status(201).json(result);
  }
}

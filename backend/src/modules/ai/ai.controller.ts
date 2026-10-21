import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { aiService } from './ai.service';

const chatSchema = z.object({
  trackingNumber: z.string().trim().min(1).max(80),
  question: z.string().trim().min(1).max(2000),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
});

const imageSchema = z.object({
  imageBase64: z.string().min(1).max(12_000_000),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  text: z.string().max(20_000).default(''),
  language: z.enum(['en', 'hi', 'mr']).optional(),
});

export class AIController {
  public complaintChat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const input = chatSchema.parse(req.body);
      const result = await aiService.askAboutComplaint(input);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public analyzeImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const input = imageSchema.parse(req.body);
      const result = await aiService.analyzeImage(input);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public transcribeAudio = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Audio file is required.' });
        return;
      }
      const result = await aiService.transcribeAudio(req.file);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}

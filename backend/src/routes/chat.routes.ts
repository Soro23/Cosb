import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { chatOrchestrator } from '../agents/chat.orchestrator.js';

export const chatRouter = Router();

chatRouter.post('/ask', async (req: AuthRequest, res: Response): Promise<void> => {
  const { question, history, autoSave, conversationTitle } = req.body as {
    question?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    autoSave?: boolean;
    conversationTitle?: string;
  };

  if (!question) {
    res.status(400).json({ error: 'question es requerido' });
    return;
  }

  const result = await chatOrchestrator({ question, history, autoSave, conversationTitle });
  res.json(result);
});

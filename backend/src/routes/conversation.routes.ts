import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { saveConversationOrchestrator } from '../agents/saveConversation.orchestrator.js';

export const conversationRouter = Router();

conversationRouter.post('/save', async (req: AuthRequest, res: Response): Promise<void> => {
  const { messages, title } = req.body as {
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    title?: string;
  };

  if (!messages || messages.length === 0) {
    res.status(400).json({ error: 'messages es requerido y no puede estar vacío' });
    return;
  }

  const result = await saveConversationOrchestrator({ messages, title });
  res.json({ success: true, path: result.path, filename: result.filename, summary: result.summary });
});

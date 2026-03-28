import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createNoteOrchestrator } from '../agents/createNote.orchestrator.js';

export const noteRouter = Router();

noteRouter.post('/create', async (req: AuthRequest, res: Response): Promise<void> => {
  const { content, folder = 'Inbox', type, userContext } = req.body as {
    content?: string;
    folder?: string;
    type?: string;
    userContext?: string;
  };

  if (!content) {
    res.status(400).json({ error: 'content es requerido' });
    return;
  }

  const result = await createNoteOrchestrator({ rawText: content, folder, type, userContext });
  res.json({ success: true, path: result.path, filename: result.filename, title: result.title });
});

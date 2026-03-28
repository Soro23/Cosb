import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { vaultSearchAgent } from '../agents/vaultSearch.agent.js';

export const searchRouter = Router();

searchRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { query, maxResults } = req.body as { query?: string; maxResults?: number };

  if (!query) {
    res.status(400).json({ error: 'query es requerido' });
    return;
  }

  const result = await vaultSearchAgent({ query, maxResults });
  res.json(result);
});

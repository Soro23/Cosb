import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { listStructure } from '../services/vault.service.js';

export const vaultRouter = Router();

vaultRouter.get('/structure', async (_req: AuthRequest, res: Response): Promise<void> => {
  const structure = await listStructure();
  res.json(structure);
});

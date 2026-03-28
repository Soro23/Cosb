import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authRouter = Router();

authRouter.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'username y password requeridos' });
    return;
  }

  if (username !== env.APP_USERNAME || password !== env.APP_PASSWORD) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }

  const token = jwt.sign({ username }, env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

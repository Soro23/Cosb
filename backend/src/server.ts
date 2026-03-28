import './config/env.js'; // Validar env vars al arranque
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { noteRouter } from './routes/note.routes.js';
import { searchRouter } from './routes/search.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { conversationRouter } from './routes/conversation.routes.js';
import { vaultRouter } from './routes/vault.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use('/api/auth', authRouter);
app.use('/api/note', authMiddleware, noteRouter);
app.use('/api/search', authMiddleware, searchRouter);
app.use('/api/chat', authMiddleware, chatRouter);
app.use('/api/conversation', authMiddleware, conversationRouter);
app.use('/api/vault', authMiddleware, vaultRouter);

app.use(errorHandler);

app.listen(parseInt(env.PORT), () => {
  logger.info(`Servidor arrancado en puerto ${env.PORT} (${env.NODE_ENV})`);
});

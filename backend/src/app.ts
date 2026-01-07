import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { analyzeSymbol } from './api/analyze.controller';
import { config } from './shared/config';
import { logger } from './shared/logger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Logger Middleware
app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Routes
app.post('/analyze', analyzeSymbol);

app.get('/health', (_req, res) => {
    res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

export default app;

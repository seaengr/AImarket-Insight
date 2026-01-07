import app from './app';
import { config } from './shared/config';
import { logger } from './shared/logger';

const server = app.listen(config.port, () => {
    logger.info(`🚀 Fintech Backend running in ${config.env} mode at http://localhost:${config.port}`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});

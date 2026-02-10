import { Request, Response } from 'express';
import { journalService } from '../modules/journal/journal.service';
import { logger } from '../shared/logger';

/**
 * Controller for trade journal related endpoints
 */
export const getJournalStats = async (req: Request, res: Response) => {
    try {
        const { symbol } = req.query;

        if (symbol && typeof symbol === 'string') {
            const stats = journalService.getStats(symbol);
            return res.json({ ...stats, scope: 'local' });
        }

        const stats = journalService.getAllStats();
        res.json({ ...stats, scope: 'global' });
    } catch (error: any) {
        logger.error(`[JournalController] Failed to get stats: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getJournalTrades = async (req: Request, res: Response) => {
    try {
        const { limit = '50' } = req.query;
        const count = parseInt(limit as string, 10);

        const history = journalService.getHistory(count);
        res.json(history);
    } catch (error: any) {
        logger.error(`[JournalController] Failed to get trades: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};


import { journalService } from './journal.service';
import { marketService } from '../market/market.service';
import { logger } from '../../shared/logger';

export class SignalOutcomeVerifier {
    /**
     * Runs periodically to verify pending signals.
     * Logic: If enough time has passed (e.g., 2h), compare entry price with current price.
     */
    async verifySignals() {
        const pending = journalService.getPendingSignals();
        if (pending.length === 0) return;

        logger.info(`[Journal] Verifying ${pending.length} pending signals...`);

        for (const log of pending) {
            // Wait at least 15 minutes before verifying for scalping context
            const timeElapsed = Date.now() - log.timestamp;
            if (timeElapsed < 15 * 60 * 1000) continue;

            try {
                // Fetch current price
                const marketData = await marketService.getMarketData(log.symbol);
                const currentPrice = marketData.price;

                let outcome: 'WIN' | 'LOSS' = 'LOSS';

                if (log.type === 'BUY') {
                    outcome = currentPrice > log.price ? 'WIN' : 'LOSS';
                } else if (log.type === 'SELL') {
                    outcome = currentPrice < log.price ? 'WIN' : 'LOSS';
                }

                journalService.updateLog(log.id, {
                    outcome,
                    verifiedAt: Date.now(),
                    actualPriceAtFullfillment: currentPrice
                });

                logger.info(`[Journal] Verified ${log.symbol} ${log.type}: ${outcome} (Entry: ${log.price}, Current: ${currentPrice})`);
            } catch (error: any) {
                logger.error(`[Journal] Verification failed for ${log.id}: ${error.message}`);
            }
        }
    }

    /**
     * Starts the verification task interval
     */
    start() {
        // Run every 30 minutes
        setInterval(() => this.verifySignals(), 30 * 60 * 1000);
        logger.info('[Journal] SignalOutcomeVerifier started (30m interval)');
    }
}

export const outcomeVerifier = new SignalOutcomeVerifier();

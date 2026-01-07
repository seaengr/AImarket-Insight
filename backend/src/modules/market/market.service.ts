import { MarketData } from '../../types/api.types';
import { logger } from '../../shared/logger';

export class MarketService {
    /**
     * Fetches latest market data. 
     * In a real app, this would call AlphaVantage/Binance/etc.
     */
    async getMarketData(symbol: string): Promise<MarketData> {
        logger.info(`Fetching market data for ${symbol}`);

        // Mock data for MVP
        return {
            symbol,
            price: symbol.includes('BTC') ? 95000 : 2650,
            change24h: 2.5,
            indicators: {
                rsi: 65,
                ema20: 94000,
                ema50: 91000
            }
        };
    }

    /**
     * Computes correlation between two assets
     */
    getCorrelation(assetA: string, assetB: string): number {
        // Deterministic mock correlation 
        // Usually calculated using Pearson coefficient on price history
        if (assetA === assetB) return 1.0;
        return 0.85;
    }
}

export const marketService = new MarketService();

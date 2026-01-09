import axios from 'axios';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';

interface AlphaVantageResponse {
    'Meta Data': any;
    'Time Series (Daily)': {
        [date: string]: {
            '1. open': string;
            '4. close': string;
        };
    };
}

export class AlphaVantageService {
    private cache: Map<string, { trend: string; timestamp: number }> = new Map();
    private CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

    /**
     * Fetches the Daily Trend (Bullish/Bearish) for a symbol to use in MTF confluence.
     * Uses caching to respect the 25 req/day limit of free tiers.
     */
    async getDailyTrend(symbol: string): Promise<string> {
        // 1. Check Cache
        const cached = this.cache.get(symbol);
        if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
            logger.info(`[AlphaVantage] Returning cached 1D trend for ${symbol}: ${cached.trend}`);
            return cached.trend;
        }

        // 2. Fallback if no key
        if (!config.market.alphaVantageApiKey) {
            logger.warn('[AlphaVantage] No API Key provided. Returning Neutral.');
            return 'Neutral';
        }

        // 3. Fetch from API
        try {
            logger.info(`[AlphaVantage] Fetching real Daily Trend for ${symbol}...`);
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${config.market.alphaVantageApiKey}`;

            const response = await axios.get<AlphaVantageResponse>(url);
            const data = response.data['Time Series (Daily)'];

            if (!data) {
                logger.warn(`[AlphaVantage] API limit reached or invalid symbol. Using fallback.`);
                return 'Neutral';
            }

            // 4. Calculate Trend (Simple Price Action: Close > Open of last 5 days)
            const days = Object.keys(data).slice(0, 5); // Last 5 days
            let bullCount = 0;

            days.forEach(day => {
                const open = parseFloat(data[day]['1. open']);
                const close = parseFloat(data[day]['4. close']);
                if (close > open) bullCount++;
            });

            // Trend Logic: If 3 or more of last 5 days were green => Bullish
            const trend = bullCount >= 3 ? 'Bullish' : 'Bearish';

            // 5. Update Cache
            this.cache.set(symbol, { trend, timestamp: Date.now() });

            return trend;

        } catch (error: any) {
            logger.error(`[AlphaVantage] Fetch failed: ${error.message}`);
            return 'Neutral';
        }
    }
}

export const alphaVantageService = new AlphaVantageService();

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
    private trendCache: Map<string, { trend: string; timestamp: number }> = new Map();
    private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
    private indicatorCache: Map<string, { value: number; timestamp: number }> = new Map();

    private TREND_DURATION = 4 * 60 * 60 * 1000; // 4 hours
    private PRICE_DURATION = 5 * 60 * 1000;      // 5 minutes
    private INDICATOR_DURATION = 60 * 60 * 1000; // 1 hour

    /**
     * Fetches current price (Global Quote)
     */
    async getQuote(symbol: string): Promise<number | null> {
        const cached = this.priceCache.get(symbol);
        if (cached && (Date.now() - cached.timestamp < this.PRICE_DURATION)) {
            return cached.price;
        }

        if (!config.market.alphaVantageApiKey) return null;

        try {
            logger.info(`[AlphaVantage] Fetching Global Quote for ${symbol}...`);
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.market.alphaVantageApiKey}`;
            const response = await axios.get(url, { timeout: 3000 });
            const quote = response.data['Global Quote'];

            if (quote && quote['05. price']) {
                const price = parseFloat(quote['05. price']);
                this.priceCache.set(symbol, { price, timestamp: Date.now() });
                return price;
            }
            return null;
        } catch (error: any) {
            logger.error(`[AlphaVantage] Quote fetch failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Fetches EMA indicator
     */
    async getEMA(symbol: string, period: number, interval: string = '60min'): Promise<number | null> {
        const cacheKey = `${symbol}_EMA_${period}_${interval}`;
        const cached = this.indicatorCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.INDICATOR_DURATION)) {
            return cached.value;
        }

        if (!config.market.alphaVantageApiKey) return null;

        try {
            logger.info(`[AlphaVantage] Fetching EMA(${period}) for ${symbol}...`);
            const url = `https://www.alphavantage.co/query?function=EMA&symbol=${symbol}&interval=${interval}&time_period=${period}&series_type=close&apikey=${config.market.alphaVantageApiKey}`;
            const response = await axios.get(url, { timeout: 3000 });

            const timeSeries = response.data['Technical Analysis: EMA'];
            if (timeSeries) {
                const latestDate = Object.keys(timeSeries)[0];
                const value = parseFloat(timeSeries[latestDate]['EMA']);
                this.indicatorCache.set(cacheKey, { value, timestamp: Date.now() });
                return value;
            }
            return null;
        } catch (error: any) {
            logger.error(`[AlphaVantage] EMA fetch failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Fetches RSI indicator
     */
    async getRSI(symbol: string, period: number = 14, interval: string = '60min'): Promise<number | null> {
        const cacheKey = `${symbol}_RSI_${period}_${interval}`;
        const cached = this.indicatorCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.INDICATOR_DURATION)) {
            return cached.value;
        }

        if (!config.market.alphaVantageApiKey) return null;

        try {
            logger.info(`[AlphaVantage] Fetching RSI(${period}) for ${symbol}...`);
            const url = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=${interval}&time_period=${period}&series_type=close&apikey=${config.market.alphaVantageApiKey}`;
            const response = await axios.get(url, { timeout: 3000 });

            const timeSeries = response.data['Technical Analysis: RSI'];
            if (timeSeries) {
                const latestDate = Object.keys(timeSeries)[0];
                const value = parseFloat(timeSeries[latestDate]['RSI']);
                this.indicatorCache.set(cacheKey, { value, timestamp: Date.now() });
                return value;
            }
            return null;
        } catch (error: any) {
            logger.error(`[AlphaVantage] RSI fetch failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Fetches a batch of benchmark assets to determine market sentiment
     * (USD Index, S&P 500, etc.)
     */
    async getBenchmarks(): Promise<Record<string, number>> {
        const cacheKey = 'MARKET_BENCHMARKS';
        const cached = this.indicatorCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.INDICATOR_DURATION)) {
            return JSON.parse(cached.value.toString()) as Record<string, number>;
        }

        if (!config.market.alphaVantageApiKey) return {};

        const benchmarks: Record<string, number> = {};
        // Benchmark mapping (Alpha Vantage symbols)
        const targets = {
            'DXY': 'UUP', // Invesco DB US Dollar Index Trust (Proxy for DXY)
            'SPX': 'SPY', // S&P 500
            'GLD': 'GLD', // Gold
            'BTC': 'BITO', // ProShares Bitcoin Strategy ETF (Proxy for BTC in Global Quote)
        };

        try {
            logger.info('[AlphaVantage] Fetching Market Benchmarks...');

            for (const [name, symbol] of Object.entries(targets)) {
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.market.alphaVantageApiKey}`;
                const response = await axios.get(url, { timeout: 2000 });
                const quote = response.data['Global Quote'];

                if (quote && quote['10. change percent']) {
                    benchmarks[name] = parseFloat(quote['10. change percent'].replace('%', ''));
                }

                // Small delay to prevent manual rate trigger (Alpha Vantage is sensitive)
                await new Promise(r => setTimeout(r, 500));
            }

            if (Object.keys(benchmarks).length > 0) {
                this.indicatorCache.set(cacheKey, {
                    value: JSON.stringify(benchmarks) as any,
                    timestamp: Date.now()
                });
            }

            return benchmarks;
        } catch (error: any) {
            logger.warn(`[AlphaVantage] Benchmark fetch partial failure: ${error.message}`);
            return benchmarks;
        }
    }

    /**
     * Fetches the Daily Trend (Bullish/Bearish) for a symbol to use in MTF confluence.
     * Uses caching to respect the 25 req/day limit of free tiers.
     */
    async getDailyTrend(symbol: string): Promise<string> {
        // 1. Check Cache
        const cached = this.trendCache.get(symbol);
        if (cached && (Date.now() - cached.timestamp < this.TREND_DURATION)) {
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

            const response = await axios.get<AlphaVantageResponse>(url, { timeout: 2000 });
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
            this.trendCache.set(symbol, { trend, timestamp: Date.now() });

            return trend;

        } catch (error: any) {
            logger.error(`[AlphaVantage] Fetch failed: ${error.message}`);
            return 'Neutral';
        }
    }
}

export const alphaVantageService = new AlphaVantageService();

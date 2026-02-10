import axios from 'axios';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';

export class TwelveDataService {
    private trendCache: Map<string, { trend: string; timestamp: number }> = new Map();
    private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
    private indicatorCache: Map<string, { value: number; timestamp: number }> = new Map();

    private TREND_DURATION = 4 * 60 * 60 * 1000; // 4 hours
    private PRICE_DURATION = 5 * 60 * 1000;      // 5 minutes
    private INDICATOR_DURATION = 60 * 60 * 1000; // 1 hour

    private cooldownUntil = 0;

    /**
     * Checks if service belongs in cooldown (rate limited)
     */
    private inCooldown(): boolean {
        return Date.now() < this.cooldownUntil;
    }

    private triggerCooldown(): void {
        logger.warn('[TwelveData] Rate limit hit. Entering 60s cooldown.');
        this.cooldownUntil = Date.now() + 61000; // 61 seconds for safety
    }

    /**
     * Twelve Data requires slashes for Forex (XAU/USD instead of XAUUSD)
     */
    private formatSymbol(symbol: string): string {
        let clean = symbol.toUpperCase().trim();

        // 1. Remove common exchange/perpetual suffixes (.P, .PRP, :MEX, .USDT)
        clean = clean.split('.')[0]; // Removes .P, .USDT, etc.
        clean = clean.split(':')[0]; // Removes :MEX, etc.

        // 2. Special mapping for GOLD (XAU)
        // If it starts with XAU, we want XAU/USD
        if (clean.startsWith('XAU')) {
            return 'XAU/USD';
        }

        // 3. Handle pairs (e.g., EURUSD -> EUR/USD)
        if (clean.length === 6 && !clean.includes('/')) {
            return `${clean.substring(0, 3)}/${clean.substring(3)}`;
        }

        // 4. Handle USDT crypto pairs (e.g., BTCUSDT -> BTC/USDT)
        if (clean.endsWith('USDT') && !clean.includes('/')) {
            return `${clean.replace('USDT', '')}/USDT`;
        }

        return clean;
    }

    /**
     * Fetches current price (Quote) including OHLC
     */
    async getQuote(symbol: string): Promise<{ price: number, open: number, high: number, low: number } | null> {
        const formattedSymbol = this.formatSymbol(symbol);

        if (!config.market.twelveDataApiKey || this.inCooldown()) return null;

        try {
            logger.info(`[TwelveData] Fetching Quote (OHLC) for ${formattedSymbol}...`);
            const url = `https://api.twelvedata.com/quote?symbol=${formattedSymbol}&apikey=${config.market.twelveDataApiKey}`;
            const response = await axios.get(url, { timeout: 5000 });
            const data = response.data;

            if (data && data.close) {
                const price = parseFloat(data.close);
                const open = parseFloat(data.open);
                const high = parseFloat(data.high);
                const low = parseFloat(data.low);

                this.priceCache.set(formattedSymbol, { price, timestamp: Date.now() });

                return { price, open, high, low };
            }

            if (data && data.status === 'error') {
                logger.error(`[TwelveData] API Error for ${formattedSymbol}: ${data.message}`);
                if (data.code === 429 || data.message.toLowerCase().includes('run out of api credits')) {
                    this.triggerCooldown();
                }
            }

            return null;
        } catch (error: any) {
            logger.error(`[TwelveData] Quote fetch failed for ${formattedSymbol}: ${error.message}`);
            if (error.response?.status === 429) this.triggerCooldown();
            return null;
        }
    }

    /**
     * Fetches EMA indicator
     */
    async getEMA(symbol: string, period: number, interval: string = '1h'): Promise<number | null> {
        const formattedSymbol = this.formatSymbol(symbol);
        const tdInterval = interval === '60min' ? '1h' : interval;
        const cacheKey = `${formattedSymbol}_EMA_${period}_${tdInterval}`;

        const cached = this.indicatorCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.INDICATOR_DURATION)) {
            return cached.value;
        }

        if (!config.market.twelveDataApiKey || this.inCooldown()) return null;

        try {
            logger.info(`[TwelveData] Fetching EMA(${period}) for ${formattedSymbol}...`);
            const url = `https://api.twelvedata.com/ema?symbol=${formattedSymbol}&interval=${tdInterval}&time_period=${period}&apikey=${config.market.twelveDataApiKey}`;
            const response = await axios.get(url, { timeout: 10000 });

            if (response.data && response.data.values && response.data.values.length > 0) {
                const value = parseFloat(response.data.values[0].ema);
                this.indicatorCache.set(cacheKey, { value, timestamp: Date.now() });
                return value;
            }

            if (response.data && response.data.status === 'error') {
                if (response.data.code === 429 || response.data.message.toLowerCase().includes('credits')) {
                    this.triggerCooldown();
                }
            }

            return null;
        } catch (error: any) {
            logger.error(`[TwelveData] EMA fetch failed for ${formattedSymbol}: ${error.message}`);
            if (error.response?.status === 429) this.triggerCooldown();
            return null;
        }
    }

    /**
     * Fetches RSI indicator
     */
    async getRSI(symbol: string, period: number = 14, interval: string = '1h'): Promise<number | null> {
        const formattedSymbol = this.formatSymbol(symbol);
        const tdInterval = interval === '60min' ? '1h' : interval;
        const cacheKey = `${formattedSymbol}_RSI_${period}_${tdInterval}`;

        const cached = this.indicatorCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.INDICATOR_DURATION)) {
            return cached.value;
        }

        if (!config.market.twelveDataApiKey || this.inCooldown()) return null;

        try {
            logger.info(`[TwelveData] Fetching RSI(${period}) for ${formattedSymbol}...`);
            const url = `https://api.twelvedata.com/rsi?symbol=${formattedSymbol}&interval=${tdInterval}&time_period=${period}&apikey=${config.market.twelveDataApiKey}`;
            const response = await axios.get(url, { timeout: 10000 });

            if (response.data && response.data.values && response.data.values.length > 0) {
                const value = parseFloat(response.data.values[0].rsi);
                this.indicatorCache.set(cacheKey, { value, timestamp: Date.now() });
                return value;
            }

            if (response.data && response.data.status === 'error') {
                if (response.data.code === 429 || response.data.message.toLowerCase().includes('credits')) {
                    this.triggerCooldown();
                }
            }

            return null;
        } catch (error: any) {
            logger.error(`[TwelveData] RSI fetch failed for ${formattedSymbol}: ${error.message}`);
            if (error.response?.status === 429) this.triggerCooldown();
            return null;
        }
    }

    /**
     * Fetches Daily Trend
     */
    async getDailyTrend(symbol: string): Promise<string> {
        const formattedSymbol = this.formatSymbol(symbol);
        const cached = this.trendCache.get(formattedSymbol);
        if (cached && (Date.now() - cached.timestamp < this.TREND_DURATION)) {
            return cached.trend;
        }

        if (!config.market.twelveDataApiKey || this.inCooldown()) return 'Neutral';

        try {
            logger.info(`[TwelveData] Fetching real Daily Trend for ${formattedSymbol}...`);
            const url = `https://api.twelvedata.com/time_series?symbol=${formattedSymbol}&interval=1day&outputsize=5&apikey=${config.market.twelveDataApiKey}`;

            const response = await axios.get(url, { timeout: 5000 });
            const data = response.data.values;

            if (!data || data.length === 0) {
                if (response.data?.status === 'error') {
                    if (response.data.code === 429 || response.data.message.toLowerCase().includes('credits')) {
                        this.triggerCooldown();
                    }
                }
                return 'Neutral';
            }

            let bullCount = 0;
            data.forEach((day: any) => {
                const open = parseFloat(day.open);
                const close = parseFloat(day.close);
                if (close > open) bullCount++;
            });

            const trend = bullCount >= 3 ? 'Bullish' : bullCount <= 2 ? 'Bearish' : 'Neutral';
            this.trendCache.set(formattedSymbol, { trend, timestamp: Date.now() });

            return trend;
        } catch (error: any) {
            logger.error(`[TwelveData] Trend fetch failed for ${formattedSymbol}: ${error.message}`);
            if (error.response?.status === 429) this.triggerCooldown();
            return 'Neutral';
        }
    }
}

export const twelveDataService = new TwelveDataService();

import axios from 'axios';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';

interface ATRData {
    value: number;
    timestamp: number;
}

export class ATRService {
    private atrCache: Map<string, ATRData> = new Map();
    private ATR_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    /**
     * Formats symbol for Twelve Data API
     */
    private formatSymbol(symbol: string): string {
        let clean = symbol.toUpperCase().trim();
        clean = clean.split('.')[0];
        clean = clean.split(':')[0];

        if (clean.startsWith('XAU')) {
            return 'XAU/USD';
        }

        if (clean.length === 6 && !clean.includes('/')) {
            return `${clean.substring(0, 3)}/${clean.substring(3)}`;
        }

        if (clean.endsWith('USDT') && !clean.includes('/')) {
            return `${clean.replace('USDT', '')}/USDT`;
        }

        return clean;
    }

    /**
     * Fetches real ATR from Twelve Data API
     */
    async getATR(symbol: string, period: number = 14, interval: string = '1h'): Promise<number | null> {
        const formattedSymbol = this.formatSymbol(symbol);
        const cacheKey = `${formattedSymbol}_ATR_${period}_${interval}`;

        const cached = this.atrCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.ATR_CACHE_DURATION)) {
            logger.info(`[ATRService] Using cached ATR for ${formattedSymbol}: ${cached.value}`);
            return cached.value;
        }

        if (!config.market.twelveDataApiKey) {
            logger.warn('[ATRService] No Twelve Data API key, using fallback ATR');
            return null;
        }

        try {
            logger.info(`[ATRService] Fetching ATR(${period}) for ${formattedSymbol}...`);
            const url = `https://api.twelvedata.com/atr?symbol=${formattedSymbol}&interval=${interval}&time_period=${period}&apikey=${config.market.twelveDataApiKey}`;
            const response = await axios.get(url, { timeout: 10000 });

            if (response.data && response.data.values && response.data.values.length > 0) {
                const value = parseFloat(response.data.values[0].atr);
                this.atrCache.set(cacheKey, { value, timestamp: Date.now() });
                logger.info(`[ATRService] Real ATR for ${formattedSymbol}: ${value}`);
                return value;
            }

            if (response.data && response.data.status === 'error') {
                logger.error(`[ATRService] API Error: ${response.data.message}`);
            }

            return null;
        } catch (error: any) {
            logger.error(`[ATRService] ATR fetch failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Get fallback ATR as percentage of price based on asset type
     */
    getFallbackATRMultiplier(symbol: string): number {
        const clean = symbol.toUpperCase();

        // Gold is highly volatile
        if (clean.includes('XAU') || clean.includes('GOLD')) {
            return 0.012; // 1.2% for Gold
        }

        // Crypto is extremely volatile
        if (clean.includes('BTC') || clean.includes('ETH') || clean.includes('CRYPTO')) {
            return 0.02; // 2% for Crypto
        }

        // Forex is less volatile
        if (clean.includes('EUR') || clean.includes('GBP') || clean.includes('JPY') || clean.includes('USD')) {
            return 0.005; // 0.5% for Forex
        }

        // Default
        return 0.01; // 1%
    }
}

export const atrService = new ATRService();

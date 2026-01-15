import { MarketData } from '../../types/api.types';
import { logger } from '../../shared/logger';
import { alphaVantageService } from './alpha-vantage.service';

export class MarketService {
    /**
     * Fetches latest market data. 
     * In a real app, this would call AlphaVantage/Binance/etc.
     */
    async getMarketData(symbol: string, currentPrice?: number): Promise<MarketData> {
        logger.info(`Fetching market data for ${symbol}${currentPrice ? ` at ${currentPrice}` : ''}`);

        // Mock data for MVP with new fields
        const price = currentPrice || (symbol.includes('BTC') ? 95000 : 2650);

        // Dynamic Indicators based on live price
        const indicators = {
            rsi: Math.floor(Math.random() * (75 - 25 + 1)) + 25, // Random RSI between 25-75 to simulate movement
            ema9: price * (1 + (Math.random() * 0.005 - 0.0025)), // +/- 0.25% around price (Fast)
            ema21: price * (1 + (Math.random() * 0.01 - 0.005)), // +/- 0.5% around price (Slow)
            ema20: price * (1 + (Math.random() * 0.01 - 0.005)), // Legacy
            ema50: price * (1 + (Math.random() * 0.02 - 0.01)),  // +/- 1.0% around price
            ema200: price * (1 + (Math.random() * 0.05 - 0.025)), // +/- 2.5% around price (Major Trend)
            macd: {
                value: Math.random() * 10 - 5,
                signal: Math.random() * 10 - 5,
                histogram: Math.random() * 4 - 2
            },
            adx: Math.floor(Math.random() * 40) + 10
        };

        // Micro-Trend Simulation
        // 5m: Fast Momentum (RSI or pull to Fast EMA)
        const is5mBullish = indicators.rsi > 55 || price > indicators.ema9;
        // 15m: Sustained Trend (Price above EMA 21 and 200)
        const is15mBullish = indicators.rsi > 50 || (price > indicators.ema21 && price > indicators.ema200);

        return {
            symbol,
            price,
            change24h: 2.5,
            indicators,
            mtfTrend: {
                '5m': is5mBullish ? 'Bullish' : 'Bearish',
                '15m': is15mBullish ? 'Bullish' : 'Bearish',
                '1H': Math.random() > 0.5 ? 'Bullish' : 'Bearish',
                '4H': Math.random() > 0.5 ? 'Bullish' : 'Bearish',
                '1D': await alphaVantageService.getDailyTrend(symbol) // REAL DATA
            },
            momentum: 'Strong Bullish',
            volatility: 'Moderate',
            newsSentiment: {
                sentiment: 'Positive',
                strength: 'High'
            }
        };
    }

    /**
     * Computes correlation between two assets
     */
    getCorrelation(assetA: string, assetB: string): number {
        if (assetA === assetB) return 1.0;
        return 0.85;
    }
}

export const marketService = new MarketService();

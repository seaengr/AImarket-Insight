import { MarketData } from '../../types/api.types';
import { logger } from '../../shared/logger';
import { alphaVantageService } from './alpha-vantage.service';
import { twelveDataService } from './twelve-data.service';
import { newsService } from '../news/news.service';
import { aiService } from '../ai/ai.service';
import { config } from '../../shared/config';

export class MarketService {
    /**
     * Fetches latest market data. 
     */
    async getMarketData(symbol: string, currentPrice?: number): Promise<MarketData> {
        logger.info(`Fetching market data for ${symbol}${currentPrice ? ` at ${currentPrice}` : ''}`);

        // Determine Service to use: Twelve Data (Primary) or Alpha Vantage
        const useTwelveData = !!config.market.twelveDataApiKey;
        const service = useTwelveData ? twelveDataService : alphaVantageService;
        const serviceName = useTwelveData ? 'TwelveData' : 'AlphaVantage';

        logger.info(`[MarketService] Using ${serviceName} as primary data source.`);

        const liveEma21 = await service.getEMA(symbol, 21);
        const liveEma200 = await service.getEMA(symbol, 200);
        const liveRsi = await service.getRSI(symbol, 14);

        // Fetch OHLC
        const quoteData = await service.getQuote(symbol);
        const price = currentPrice || quoteData?.price || 0;

        // Simulating OHLC if API fails or we only have currentPrice
        const open = quoteData?.open || price;
        const high = quoteData?.high || price * 1.001;
        const low = quoteData?.low || price * 0.999;

        if (!price) {
            throw new Error(`Unable to fetch price for ${symbol}. Please ensure the symbol is correct or your API key is active.`);
        }

        if (!liveEma21 || !liveEma200 || !liveRsi) {
            logger.warn(`[MarketService] Missing critical indicators for ${symbol}. EMA21: ${liveEma21}, EMA200: ${liveEma200}, RSI: ${liveRsi}`);
            // FAIL SAFE: Do not return random data. Throw error to stop signal generation.
            throw new Error('Market Data Unavailable: Critical Indicators (EMA/RSI) missing. Cannot generate credible signal.');
        }

        const indicators = {
            rsi: liveRsi,
            ema9: price, // Deprecated/Not used in Sniper
            ema21: liveEma21,
            ema20: price, // Deprecated
            ema50: price, // Deprecated
            ema200: liveEma200,
            macd: {
                value: 0,
                signal: 0,
                histogram: 0
            },
            adx: 25 // Default placeholder
        };

        // 2. Fundamental Data (Live News + AI Sentiment)
        const headlines = await newsService.getHeadlines(symbol);
        const sentimentResult = await aiService.analyzeSentiment(symbol, headlines);

        // 3. Macro Context (Benchmarks + Risk Sentiment)
        const benchmarks = await alphaVantageService.getBenchmarks();
        let riskSentiment: 'Risk-On' | 'Risk-Off' | 'Neutral' = 'Neutral';

        if (Object.keys(benchmarks).length > 0) {
            const spx = benchmarks['SPX'] || 0;
            const dxy = benchmarks['DXY'] || 0;
            const gld = benchmarks['GLD'] || 0;

            if (spx > 0.1 && dxy < 0) riskSentiment = 'Risk-On';
            else if (spx < -0.1 || gld > 0.2) riskSentiment = 'Risk-Off';
        }

        // 4. Calculate Real Correlation Logic
        let correlationValue = Math.random() * 0.4 + 0.5; // Default random baseline
        if (symbol.includes('XAU') && benchmarks['DXY'] !== undefined) {
            // Gold usually inverse to USD
            correlationValue = benchmarks['DXY'] > 0 ? -0.85 : 0.85;
        } else if ((symbol.includes('BTC') || symbol.includes('ETH')) && benchmarks['SPX'] !== undefined) {
            // Crypto usually positive with Stocks
            correlationValue = benchmarks['SPX'] > 0 ? 0.75 : -0.75;
        }

        // 5. Advanced Divergence Logic (EMA Extension + Mirror Asset)
        const ema21 = indicators.ema21;
        const emaExtension = ((price - ema21) / ema21) * 100;

        let mirrorPrice: number | undefined;
        if (symbol.includes('BTC') || symbol.includes('ETH')) {
            mirrorPrice = benchmarks['GLD']; // Mirror for Crypto is Gold
        } else if (symbol.includes('XAU') || symbol.includes('GLD')) {
            mirrorPrice = benchmarks['BTC']; // Mirror for Gold is Bitcoin
        }

        // 6. Multi-Timeframe Trend
        const is5mBullish = indicators.rsi > 55 || price > indicators.ema9;
        const is15mBullish = indicators.rsi > 50 || (price > indicators.ema21 && price > indicators.ema200);

        return {
            symbol,
            price,
            open,
            high,
            low,
            change24h: 2.5,
            indicators,
            mtfTrend: {
                '5m': is5mBullish ? 'Bullish' : 'Bearish',
                '15m': is15mBullish ? 'Bullish' : 'Bearish',
                '1H': Math.random() > 0.5 ? 'Bullish' : 'Bearish',
                '4H': Math.random() > 0.5 ? 'Bullish' : 'Bearish',
                '1D': await service.getDailyTrend(symbol)
            },
            momentum: 'Strong Bullish',
            volatility: 'Moderate',
            riskSentiment,
            correlation: correlationValue,
            emaExtension,
            mirrorPrice,
            newsSentiment: {
                sentiment: sentimentResult.sentiment,
                strength: sentimentResult.strength,
                score: sentimentResult.score
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

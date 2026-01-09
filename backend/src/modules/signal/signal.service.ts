import { MarketData, SignalType, ConfidenceBreakdown } from '../../types/api.types';
import { logger } from '../../shared/logger';

export interface SignalResult {
    type: SignalType;
    confidence: number;
    breakdown: ConfidenceBreakdown;
    reasons: string[];
}

export class SignalService {
    /**
     * Deterministic rules engine with detailed confidence breakdown.
     */
    generateSignal(data: MarketData, correlation: number): SignalResult {
        logger.info(`Generating signal for ${data.symbol}`);

        const { rsi, ema20, ema50 } = data.indicators;

        // Breakdown components (max 100 total for confidence)
        let trend = 0;
        let corr = 0;
        let momentum = 0;
        let volatility = 0;
        let news = 0;

        const reasons: string[] = [];

        // Trend Breakdown
        if (data.price > ema20 && ema20 > ema50) {
            trend = 30;
            reasons.push('Price is above EMA20 and EMA50 (Strong Uptrend)');
        } else if (data.price < ema20 && ema20 < ema50) {
            trend = -30;
            reasons.push('Price is below EMA20 and EMA50 (Strong Downtrend)');
        }

        // Correlation Breakdown
        if (correlation > 0.8) {
            corr = 20;
            reasons.push('High positive correlation with benchmark asset');
        }

        // Momentum Breakdown (Day Trading Tuning: 35/65)
        if (rsi < 35) {
            momentum = 25;
            reasons.push('RSI is Oversold (<35) - Bullish Momentum');
        } else if (rsi > 65) {
            momentum = -25;
            reasons.push('RSI is Overbought (>65) - Bearish Pressure');
        }

        // Volatility Breakdown
        if (data.volatility === 'Moderate') {
            volatility = 10;
            reasons.push('Current volatility is within stable ranges');
        }

        // News Breakdown
        if (data.newsSentiment?.sentiment === 'Positive') {
            news = 15;
            reasons.push('Market sentiment is positive based on recent news');
        }

        const totalScore = trend + corr + momentum + volatility + news;
        const finalConfidence = Math.abs(totalScore);

        let type: SignalType = 'HOLD';
        if (totalScore >= 50) type = 'BUY';
        if (totalScore <= -50) type = 'SELL';

        return {
            type,
            confidence: Math.min(finalConfidence, 100),
            breakdown: {
                trend: Math.abs(trend),
                correlation: Math.abs(corr),
                momentum: Math.abs(momentum),
                volatility: Math.abs(volatility),
                news: Math.abs(news)
            },
            reasons
        };
    }

    calculateLevels(price: number, type: SignalType) {
        // --- Day Trading & Scalping Profile (0.5% Volatility) ---
        const atr = price * 0.005;

        // Tight Entry Zone (0.1% buffer)
        const entryLow = price * 0.999;
        const entryHigh = price * 1.001;

        if (type === 'BUY') {
            return {
                entryZone: { low: entryLow, high: entryHigh },
                takeProfit: {
                    tp1: price + atr,           // 1:1 RR
                    tp2: price + (atr * 1.5),   // 1.5:1 RR
                    tp3: price + (atr * 2)      // 2:1 RR
                },
                stopLoss: price - atr
            };
        }
        return {
            entryZone: { low: entryLow, high: entryHigh },
            takeProfit: {
                tp1: price - atr,
                tp2: price - (atr * 1.5),
                tp3: price - (atr * 2.5)
            },
            stopLoss: price + atr
        };
    }
}

export const signalService = new SignalService();

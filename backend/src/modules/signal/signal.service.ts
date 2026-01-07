import { MarketData, SignalType } from '../../types/api.types';
import { logger } from '../../shared/logger';

export interface SignalResult {
    type: SignalType;
    confidence: number;
    reasons: string[];
}

export class SignalService {
    /**
     * Deterministic rules engine to generate trade signals.
     * AI DOES NOT DECIDE THESE.
     */
    generateSignal(data: MarketData, correlation: number): SignalResult {
        logger.info(`Generating signal for ${data.symbol}`);

        const { rsi, ema20, ema50 } = data.indicators;
        let confidence = 0;
        const reasons: string[] = [];

        // Rule 1: Trend Following (EMA Cross)
        if (data.price > ema20 && ema20 > ema50) {
            confidence += 40;
            reasons.push('Price is above EMA20 and EMA50 (Strong Uptrend)');
        } else if (data.price < ema20 && ema20 < ema50) {
            confidence -= 40;
            reasons.push('Price is below EMA20 and EMA50 (Strong Downtrend)');
        }

        // Rule 2: RSI Overbought/Oversold
        if (rsi > 70) {
            confidence -= 20;
            reasons.push('RSI is Overbought (>70)');
        } else if (rsi < 30) {
            confidence += 20;
            reasons.push('RSI is Oversold (<30)');
        }

        // Rule 3: Market Correlation (Context)
        if (correlation > 0.8) {
            confidence *= 1.1; // Boost confidence if markets are moving together
            reasons.push('High positive correlation with benchmark asset');
        }

        // Final Decision
        let type: SignalType = 'HOLD';
        const finalScore = Math.abs(confidence);

        if (confidence >= 50) type = 'BUY';
        if (confidence <= -50) type = 'SELL';

        return {
            type,
            confidence: Math.min(Math.round(finalScore), 100),
            reasons
        };
    }

    calculateLevels(price: number, type: SignalType) {
        const atr = price * 0.02; // Simple 2% ATR mock

        if (type === 'BUY') {
            return {
                entryZone: { low: price * 0.995, high: price * 1.005 },
                takeProfit: {
                    tp1: price + atr,
                    tp2: price + (atr * 2),
                    tp3: price + (atr * 3)
                },
                stopLoss: price - atr
            };
        }

        // Default or SELL levels
        return {
            entryZone: { low: price * 0.995, high: price * 1.005 },
            takeProfit: {
                tp1: price - atr,
                tp2: price - (atr * 2),
            },
            stopLoss: price + atr
        };
    }
}

export const signalService = new SignalService();

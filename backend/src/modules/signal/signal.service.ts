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
        let mtfScore = 0; // New MTF Component
        let corr = 0;
        let momentum = 0;
        let volatility = 0;
        let news = 0;
        let pineScript = 0; // New Pine Script Component

        const reasons: string[] = [];

        // Trend Breakdown (Single Timeframe) & Pine Script Logic
        const { ema9, ema21 } = data.indicators;

        // Pine Script: "Simple Pullback" Logic
        const isPineUptrend = ema9 > ema21;
        const isPineDowntrend = ema9 < ema21;

        // Logic: Price pulls back to Fast EMA (wicks down) but stays above Slow EMA
        const isPullbackBuy = isPineUptrend && data.price <= (ema9 * 1.0005) && data.price > ema21;
        const isPullbackSell = isPineDowntrend && data.price >= (ema9 * 0.9995) && data.price < ema21;

        if (isPullbackBuy) {
            pineScript = 30;
            reasons.push('Pine Script: Classic Pullback Buy Setup (Bounce off EMA9)');
        } else if (isPullbackSell) {
            pineScript = -30;
            reasons.push('Pine Script: Classic Pullback Sell Setup (Reject off EMA9)');
        }

        if (data.price > ema20 && ema20 > ema50) {
            trend = 20;
            reasons.push('Price is above EMA20 and EMA50 (Uptrend)');
        } else if (data.price < ema20 && ema20 < ema50) {
            trend = -20;
            reasons.push('Price is below EMA20 and EMA50 (Downtrend)');
        }

        // --- MTF Confluence (The "Secret Sauce") ---
        const { '1H': tf1h, '4H': tf4h, '1D': tf1d } = data.mtfTrend;
        const isBullishConfluence = tf1h === 'Bullish' && tf4h === 'Bullish';
        const isBearishConfluence = tf1h === 'Bearish' && tf4h === 'Bearish';

        if (isBullishConfluence) {
            mtfScore = 25;
            reasons.push(`Strong Confluence: 1H & 4H are both Bullish`);
            if (tf1d === 'Bullish') {
                mtfScore += 10;
                reasons.push('Daily (1D) Trend aligned - High Probability Setup');
            }
        } else if (isBearishConfluence) {
            mtfScore = -25;
            reasons.push(`Strong Confluence: 1H & 4H are both Bearish`);
            if (tf1d === 'Bearish') {
                mtfScore -= 10;
                reasons.push('Daily (1D) Trend aligned - High Probability Setup');
            }
        } else {
            reasons.push('Mixed Signals across timeframes (Caution)');
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

        const totalScore = trend + mtfScore + corr + momentum + volatility + news + pineScript;
        const finalConfidence = Math.abs(totalScore);

        let type: SignalType = 'HOLD';
        if (totalScore >= 50) type = 'BUY';
        if (totalScore <= -50) type = 'SELL';

        return {
            type,
            confidence: Math.min(finalConfidence, 100),
            breakdown: {
                trend: Math.abs(trend + mtfScore), // Combine for UI simplicity
                correlation: Math.abs(corr),
                momentum: Math.abs(momentum),
                volatility: Math.abs(volatility),
                news: Math.abs(news)
                // Pine script score is implicitly added to 'trend' in breakdown for now, or could be separate.
                // For UI simplicity, adding it to trend or making 'strategy' category.
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

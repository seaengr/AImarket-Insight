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

        const { rsi } = data.indicators;
        const { ema9, ema21, ema200 } = data.indicators;

        // Breakdown components (max 100 total for confidence)
        let trend = 0;
        let mtfScore = 0;
        let corr = 0;
        let momentum = 0;
        let volatility = 0;
        let news = 0;
        let pineScript = 0;

        const reasons: string[] = [];

        // 1. Trend Analysis (EMA 21 & 200 Strategy)
        // Golden Cross Logic: EMA 21 > EMA 200 implies long-term bullishness
        const isGoldenCross = ema21 > ema200;
        const isDeathCross = ema21 < ema200;

        // Major Trend Determination
        if (data.price > ema21 && isGoldenCross) {
            trend = 30;
            reasons.push('Strong Bullish Trend: Price > EMA21 > EMA200');
        } else if (data.price < ema21 && isDeathCross) {
            trend = -30;
            reasons.push('Strong Bearish Trend: Price < EMA21 < EMA200');
        } else if (isGoldenCross) {
            trend = 15;
            reasons.push('Golden Cross Active (EMA 21 > EMA 200) - Bullish Bias');
        } else if (isDeathCross) {
            trend = -15;
            reasons.push('Death Cross Active (EMA 21 < EMA 200) - Bearish Bias');
        }

        // 2. Strategy: Pullback Level (EMA 21) - Matching Pine Script Logic
        // Pine Script Conditions:
        // - BUY: uptrend AND low <= fast AND close > fast AND greenCandle AND rsi > 30 AND rsi < 70
        // - SELL: downtrend AND high >= fast AND close < fast AND redCandle AND rsi > 30 AND rsi < 70

        const rsiInRange = rsi > 30 && rsi < 70; // Not overbought or oversold

        // Simulate candle color: If price > ema21, likely closed green. If price < ema21, likely closed red.
        const isGreenCandle = data.price > ema21; // Simplified: Bullish close
        const isRedCandle = data.price < ema21;   // Simplified: Bearish close

        // Perfect Pullback BUY: Golden Cross + Price touched EMA21 + Bounced up + RSI in range
        const isPullbackBuy = isGoldenCross && data.price <= (ema21 * 1.002) && data.price > ema21 && rsiInRange;

        // Perfect Pullback SELL: Death Cross + Price touched EMA21 + Rejected down + RSI in range
        const isPullbackSell = isDeathCross && data.price >= (ema21 * 0.998) && data.price < ema21 && rsiInRange;

        // Alternative: Oversold/Overbought Bounces (from Pine Script)
        const buyOversold = rsi < 30 && isGreenCandle;
        const sellOverbought = rsi > 70 && isRedCandle;

        if (isPullbackBuy || buyOversold) {
            pineScript = 30;
            if (isPullbackBuy) {
                reasons.push('Pine Script: Perfect Pullback to EMA 21 + RSI Confirmed');
            } else {
                reasons.push('Pine Script: Oversold Bounce (RSI < 30) + Green Candle');
            }
        } else if (isPullbackSell || sellOverbought) {
            pineScript = -30;
            if (isPullbackSell) {
                reasons.push('Pine Script: Perfect Pullback to EMA 21 + RSI Confirmed');
            } else {
                reasons.push('Pine Script: Overbought Rejection (RSI > 70) + Red Candle');
            }
        }

        // --- MTF Confluence (The "Secret Sauce") ---
        const { '5m': tf5m, '15m': tf15m, '1H': tf1h, '4H': tf4h, '1D': tf1d } = data.mtfTrend;
        const isBullishConfluence = tf1h === 'Bullish' && tf4h === 'Bullish';
        const isBearishConfluence = tf1h === 'Bearish' && tf4h === 'Bearish';

        // Micro-Trend Verification (Sniper Entry) using 5m/15m
        if (tf5m === 'Bullish' || tf15m === 'Bullish') {
            if (trend > 0 || isBullishConfluence) {
                mtfScore += 10;
                reasons.push('Micro-Trend (5m/15m) aligns Bullish - Sniper Entry');
            }
        } else if (tf5m === 'Bearish' || tf15m === 'Bearish') {
            if (trend < 0 || isBearishConfluence) {
                mtfScore -= 10;
                reasons.push('Micro-Trend (5m/15m) aligns Bearish - Sniper Entry');
            }
        }

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
                trend: Math.abs(trend + mtfScore),
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

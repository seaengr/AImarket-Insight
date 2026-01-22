import { MarketData, SignalType, ConfidenceBreakdown } from '../../types/api.types';
import { logger } from '../../shared/logger';
import { journalService } from '../journal/journal.service';

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

        // 0. Get Historical Learning Stats (Reinforcement Learning)
        const stats = journalService.getStats(data.symbol);
        const winRate = stats.winRate;
        const totalTrades = stats.totalTrades;

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

        // 4. Momentum Breakdown (Day Trading Tuning: 35/65)
        if (rsi < 35) {
            momentum = 25;
            reasons.push('RSI is Oversold (<35) - Bullish Momentum');
        } else if (rsi > 65) {
            momentum = -25;
            reasons.push('RSI is Overbought (>65) - Bearish Pressure');
        }

        // 5. Volatility Breakdown
        if (data.volatility === 'Moderate') {
            volatility = 10;
            reasons.push('Current volatility is within stable ranges');
        }

        // Calculate a Baseline Score for Macro Realignment
        const baselineScore = trend + mtfScore + pineScript + momentum + volatility;

        // 6. Correlation Breakdown (Inter-market Accuracy)
        if (Math.abs(data.correlation) > 0.8) {
            corr = 15;
            reasons.push(`High correlation (${data.correlation > 0 ? 'Positive' : 'Inverse'}) with benchmark asset confirmed`);
        } else if (Math.abs(data.correlation) < 0.3) {
            corr = -5;
            reasons.push('Warning: Asset is decoupling from its usual benchmark');
        }

        // 7. Macro Context (Risk Sentiment)
        if (data.riskSentiment !== 'Neutral') {
            const isRiskAsset = data.symbol.includes('BTC') || data.symbol.includes('ETH') || data.symbol.includes('SPX');
            const isSafeHaven = data.symbol.includes('XAU') || data.symbol.includes('JPY');

            if (data.riskSentiment === 'Risk-On' && (isRiskAsset || baselineScore < 0 && isSafeHaven)) {
                news += 10;
                reasons.push('Macro Alignment: Current Risk-On sentiment supports this move');
            } else if (data.riskSentiment === 'Risk-Off' && (isSafeHaven || baselineScore < 0 && isRiskAsset)) {
                news += 10;
                reasons.push('Macro Alignment: Current Risk-Off sentiment supports this move');
            }
        }

        // --- NEW: EMA Extension & Mirror Divergence (Step 5) ---
        if (data.emaExtension) {
            if (data.emaExtension > 3 && baselineScore > 0) {
                // Penalize buying if overextended
                reasons.push("Alert: Price is overextended from EMA 21 (>3%). Retracement likely.");
            } else if (data.emaExtension < -3 && baselineScore < 0) {
                // Penalize selling if overextended
                reasons.push("Alert: Price is overextended from EMA 21 (<-3%). Retracement likely.");
            }
        }

        if (data.mirrorPrice && data.correlation < 0) {
            // Check for divergence in mirrored assets (e.g. BTC vs XAU)
            const isMirrorUp = data.mirrorPrice > 0;
            const isAssetUp = baselineScore > 0;
            if (isMirrorUp === isAssetUp) {
                // Should be moving in opposite directions
                news -= 15;
                reasons.push(`Divergence Caution: Asset moving with its inverse mirror. Prediction: Potential reversal or chop.`);
            }
        }

        // 8. News Breakdown (Fundamental Context)
        if (data.newsSentiment && data.newsSentiment.score !== undefined) {
            const newsScore = data.newsSentiment.score;
            news += Math.round(newsScore * 0.2); // Add to existing macro adjustment

            if (Math.abs(newsScore) > 30) {
                reasons.push(`AI News Sentiment: ${data.newsSentiment.sentiment} (${data.newsSentiment.strength})`);
            }

            if (Math.abs(newsScore) > 70) {
                reasons.push(`WARNING: High impact news detected (${data.newsSentiment.sentiment})`);
            }
        }

        const totalScore = baselineScore + corr + news;

        // --- REINFORCEMENT LEARNING ADJUSTMENT ---
        let finalConfidence = Math.abs(totalScore);

        // If we have enough data (at least 5 trades), adjust confidence
        if (totalTrades >= 5) {
            // If win rate is high (>65%), boost confidence slightly
            if (winRate > 65) {
                finalConfidence *= 1.1;
                reasons.push(`AI Feedback: High accuracy on ${data.symbol} (${winRate}%). Confidence boosted.`);
            }
            // If win rate is low (<45%), penalize confidence
            else if (winRate < 45) {
                finalConfidence *= 0.8;
                reasons.push(`AI Feedback: Low accuracy on ${data.symbol} recently (${winRate}%). Proceed with caution.`);
            }
        }

        let type: SignalType = 'HOLD';
        if (totalScore >= 50) type = 'BUY';
        if (totalScore <= -50) type = 'SELL';

        return {
            type,
            confidence: Math.min(Math.round(finalConfidence), 100),
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
        if (type === 'HOLD') {
            return {
                entryZone: { low: 0, high: 0 },
                takeProfit: { tp1: 0, tp2: 0, tp3: 0 },
                stopLoss: 0
            };
        }

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

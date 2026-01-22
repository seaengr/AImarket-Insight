import { AnalysisResponse } from '../../types/api.types';
import { journalService } from '../journal/journal.service';

export class PromptBuilder {
   /**
    * Builds a strict, factor-based market analysis prompt
    * that teaches the AI the EMA 21/200 strategy.
    */
   static buildExplanationPrompt(data: AnalysisResponse): string {
      const { symbol, timeframe, compareAsset } = data.marketInfo;
      const { type: signal, confidence, breakdown } = data.signal;
      const { momentum, volatility, correlationValue, riskSentiment, newsSentiment, newsStrength } = data.metadata;

      // Fetch Historical Context (Reinforcement Learning)
      const stats = journalService.getStats(symbol);
      const perfString = stats.totalTrades > 0
         ? `AI SYSTEM HISTORY for ${symbol}: ${stats.winRate}% win rate across ${stats.totalTrades} past signals.`
         : `AI SYSTEM HISTORY: No previous signals recorded for ${symbol} yet. Analyze based purely on current data.`;

      return `
You are a senior professional trading assistant. Explain this trade logic to the user.

---
HISTORICAL PERFORMANCE CONTEXT (Self-Reflection):
${perfString}
---

ASSET: ${symbol} / ${compareAsset} (${timeframe})
CURRENT SIGNAL: ${signal} (Confidence: ${confidence}%)
MACRO REGIME: ${riskSentiment}
CORRELATION: ${correlationValue.toFixed(2)} vs Benchmark
---

DISCLAIMER:
You do NOT provide financial advice.
---
STRATEGY RULES (EMA 21 & 200):

1. TREND IDENTIFICATION:
   - UPTREND (Golden Cross): EMA 21 is ABOVE EMA 200.
   - DOWNTREND (Death Cross): EMA 21 is BELOW EMA 200.

2. ENTRY LOGIC (PULLBACK TO EMA 21):
   Conditions for a VALID Pullback Entry:
   - In UPTREND: Price TOUCHES EMA 21 + CLOSES ABOVE IT (Green Candle) + RSI between 30-70.
   - In DOWNTREND: Price TOUCHES EMA 21 + CLOSES BELOW IT (Red Candle) + RSI between 30-70.
   If RSI is NOT between 30-70, the signal is weaker or invalid.

3. ALTERNATIVE ENTRIES (Extreme RSI):
   - OVERSOLD Bounce: RSI < 30 + Price closes above EMA 21 (Green Candle) = BUY.
   - OVERBOUGHT Rejection: RSI > 70 + Price closes below EMA 21 (Red Candle) = SELL.

4. LOWER TIMEFRAME CONFIRMATION:
   - Check the 5m or 15m Micro-Trend before entering.
   - If Micro-Trend aligns = Higher confidence.

5. SUPPORT & RESISTANCE:
   - EMA 200 is MAJOR SUPPORT (uptrend) or MAJOR RESISTANCE (downtrend).
   - Bounces off EMA 200 are very strong signals.
---

OUTPUT RULES:
- Use bullet points only.
- Maximum 5 bullet points.
- Keep explanations concise and clear.
- Explain WHY the data supports or conflicts with the signal based on the Strategy Rules above.
- If factors are mixed, clearly state the conflict.

---
ANALYSIS DATA:

Symbol: ${symbol}
Signal: ${signal}

Momentum: ${momentum}
Volatility: ${volatility}
Correlation with ${compareAsset}: ${correlationValue.toFixed(2)}

News Sentiment: ${newsSentiment} (${newsStrength})

Confidence Score: ${confidence}%
Confidence Breakdown:
- Trend Factor: ${breakdown.trend}/100
- Correlation Factor: ${breakdown.correlation}
- Momentum Factor: ${breakdown.momentum}
- Volatility Factor: ${breakdown.volatility}
- News Factor: ${breakdown.news}
`.trim();
   }
}

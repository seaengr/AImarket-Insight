import axios from 'axios';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import { atrService } from '../market/atr.service';

export interface SLTPLevels {
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
    entryLow: number;
    entryHigh: number;
    atrValue: number;
    reasoning: string;
}

export class SLTPService {
    /**
     * Calculates dynamic SL/TP levels using AI or rule-based fallback
     */
    async calculateLevels(
        symbol: string,
        price: number,
        signalType: 'BUY' | 'SELL',
        rsi: number,
        newsSentiment: string = 'Neutral'
    ): Promise<SLTPLevels> {

        // 1. Get Real ATR or Fallback
        let atr = await atrService.getATR(symbol, 14, '1h');

        if (!atr || atr <= 0) {
            // Fallback: Use percentage-based ATR
            const multiplier = atrService.getFallbackATRMultiplier(symbol);
            atr = price * multiplier;
            logger.info(`[SLTPService] Using fallback ATR for ${symbol}: ${atr.toFixed(2)} (${(multiplier * 100).toFixed(2)}%)`);
        } else {
            logger.info(`[SLTPService] Using real ATR for ${symbol}: ${atr.toFixed(2)}`);
        }

        // 2. Calculate Multipliers (Rule-based for now, AI integration later)
        let slMultiplier = 1.0;
        let tpMultiplier = 1.0;
        let reasoning = '';

        // Adjust based on RSI
        if (rsi < 30) {
            // Oversold - Expect strong bounce, tighter SL
            slMultiplier = 0.8;
            tpMultiplier = 1.2;
            reasoning += 'RSI oversold: tighter SL, extended TP. ';
        } else if (rsi > 70) {
            // Overbought - Expect reversal, tighter SL
            slMultiplier = 0.8;
            tpMultiplier = 1.2;
            reasoning += 'RSI overbought: tighter SL, extended TP. ';
        } else {
            reasoning += 'RSI neutral: standard levels. ';
        }

        // Adjust based on News Sentiment
        if (newsSentiment.toLowerCase().includes('high') || newsSentiment.toLowerCase().includes('extreme')) {
            slMultiplier *= 1.5; // Wider SL for high-impact news
            reasoning += 'High-impact news: widened SL for volatility. ';
        }

        // Asset-specific adjustments
        const cleanSymbol = symbol.toUpperCase();
        if (cleanSymbol.includes('XAU') || cleanSymbol.includes('GOLD')) {
            slMultiplier *= 1.2; // Gold needs extra room
            reasoning += 'Gold: +20% SL buffer for volatility. ';
        } else if (cleanSymbol.includes('BTC') || cleanSymbol.includes('ETH')) {
            slMultiplier *= 1.5; // Crypto needs even more room
            tpMultiplier *= 1.3;
            reasoning += 'Crypto: extended SL/TP for high volatility. ';
        }

        // 3. Calculate Final Levels
        const finalSL = atr * slMultiplier;
        const finalTP1 = atr * tpMultiplier * 1.0;
        const finalTP2 = atr * tpMultiplier * 1.5;
        const finalTP3 = atr * tpMultiplier * 2.0;

        // Entry Zone (0.1% buffer)
        const entryLow = price * 0.999;
        const entryHigh = price * 1.001;

        if (signalType === 'BUY') {
            return {
                stopLoss: price - finalSL,
                takeProfit1: price + finalTP1,
                takeProfit2: price + finalTP2,
                takeProfit3: price + finalTP3,
                entryLow,
                entryHigh,
                atrValue: atr,
                reasoning: reasoning.trim()
            };
        } else {
            return {
                stopLoss: price + finalSL,
                takeProfit1: price - finalTP1,
                takeProfit2: price - finalTP2,
                takeProfit3: price - finalTP3,
                entryLow,
                entryHigh,
                atrValue: atr,
                reasoning: reasoning.trim()
            };
        }
    }

    /**
     * AI-powered SL/TP calculation using Ollama
     * This is the advanced version that uses LLM to decide multipliers
     */
    async calculateLevelsWithAI(
        symbol: string,
        price: number,
        signalType: 'BUY' | 'SELL',
        rsi: number,
        atr: number,
        newsSentiment: string
    ): Promise<{ slMultiplier: number; tpMultiplier: number; reasoning: string }> {

        const prompt = `You are a professional forex/gold trader. Analyze this trade setup and recommend SL/TP multipliers.

Trade Setup:
- Asset: ${symbol}
- Price: ${price}
- Signal: ${signalType}
- RSI: ${rsi}
- ATR (14-period): ${atr}
- News Sentiment: ${newsSentiment}

Based on the volatility and conditions, output ONLY this JSON (no other text):
{
    "slMultiplier": number between 0.8 and 2.0,
    "tpMultiplier": number between 1.0 and 2.5,
    "reasoning": "brief explanation"
}`;

        try {
            const response = await axios.post(config.ai.ollamaUrl, {
                model: 'gemma3:4b',
                prompt: prompt,
                stream: false,
            }, { timeout: 30000 });

            const text = response.data.response || '';
            const jsonMatch = text.match(/\{.*\}/s);

            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    slMultiplier: Math.max(0.8, Math.min(2.0, result.slMultiplier || 1.0)),
                    tpMultiplier: Math.max(1.0, Math.min(2.5, result.tpMultiplier || 1.0)),
                    reasoning: result.reasoning || 'AI analysis complete'
                };
            }
        } catch (error: any) {
            logger.warn(`[SLTPService] AI calculation failed: ${error.message}, using rule-based fallback`);
        }

        // Fallback to neutral
        return { slMultiplier: 1.0, tpMultiplier: 1.0, reasoning: 'AI unavailable, using standard levels' };
    }
}

export const sltpService = new SLTPService();

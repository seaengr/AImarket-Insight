import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import { PromptBuilder } from './prompt.builder';
import { AnalysisResponse } from '../../types/api.types';

export class AIService {
    /**
     * Generates a natural language explanation for the signal.
     * Uses real AI (HuggingFace/Ollama/Gemini) if configured, else mock.
     */
    async explainSignal(data: AnalysisResponse): Promise<string[]> {
        const { symbol } = data.marketInfo;
        const { type: signal } = data.signal;

        if (config.ai.provider === 'mock') {
            return this.generateMockExplanation(symbol, signal, []);
        }

        try {
            logger.info(`Requesting AI explanation for ${symbol} via ${config.ai.provider}`);
            const prompt = PromptBuilder.buildExplanationPrompt(data);

            // 1. Check Configured Provider: GEMINI (Primary)
            if (config.ai.provider === 'gemini' || config.ai.geminiApiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
                    const model = genAI.getGenerativeModel({ model: config.ai.model || "gemini-1.5-flash" });

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();

                    return this.formatBullets(text);
                } catch (err: any) {
                    logger.warn(`Gemini failed (${err.message}), attempting fallback to Ollama...`);
                }
            }

            // 2. Check Configured Provider: OLLAMA (Secondary / Fallback)
            if (config.ai.provider === 'ollama' || config.ai.provider === 'gemini') {
                try {
                    const response = await axios.post(config.ai.ollamaUrl, {
                        model: config.ai.model,
                        prompt: prompt,
                        stream: false,
                    }, { timeout: 60000 });

                    const rawText = response.data.response || '';
                    return this.formatBullets(rawText);
                } catch (err: any) {
                    logger.warn(`Ollama failed (${err.message}), attempting fallback to HuggingFace...`);
                }
            }

            // 3. Last Resort: HuggingFace
            if (config.ai.apiKey) {
                try {
                    const response = await axios.post(
                        `https://api-inference.huggingface.co/models/${config.ai.model}`,
                        { inputs: prompt },
                        {
                            headers: { Authorization: `Bearer ${config.ai.apiKey}` },
                            timeout: 10000,
                        }
                    );

                    const aiText = response.data[0]?.generated_text || '';
                    const cleanText = aiText.replace(prompt, '').trim();

                    if (cleanText) return this.formatBullets(cleanText);
                } catch (err: any) {
                    logger.warn(`HuggingFace failed (${err.message}).`);
                }
            }

            return this.generateMockExplanation(symbol, signal, []);
        } catch (error: any) {
            logger.error(`AI explanation failed (${error.message}), falling back to mock`);
            return this.generateMockExplanation(symbol, signal, []);
        }
    }

    /**
     * Analyzes news sentiment for a list of headlines.
     * Returns a score from -100 to +100 and a label.
     */
    async analyzeSentiment(symbol: string, headlines: string[]): Promise<{ score: number; sentiment: string; strength: string }> {
        if (headlines.length === 0 || config.ai.provider === 'mock') {
            return { score: 0, sentiment: 'Neutral', strength: 'Low' };
        }

        try {
            logger.info(`Analyzing sentiment for ${symbol} headlines...`);

            const prompt = `
            Analyze the following financial news headlines for the asset ${symbol}.
            Headlines:
            ${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

            Rate the overall sentiment from -100 (Extremely Bearish) to +100 (Extremely Bullish).
            Provide your response ONLY in this JSON format:
            {
                "score": number,
                "sentiment": "Bullish" | "Bearish" | "Neutral",
                "strength": "High" | "Moderate" | "Low"
            }
            `.trim();

            let text = '';

            if (config.ai.provider === 'gemini' || config.ai.geminiApiKey) {
                const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
                const model = genAI.getGenerativeModel({ model: config.ai.model || "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                text = (await result.response).text();
            } else if (config.ai.provider === 'ollama') {
                const response = await axios.post(config.ai.ollamaUrl, {
                    model: config.ai.model,
                    prompt: prompt,
                    stream: false,
                });
                text = response.data.response || '';
            }

            // Extract JSON from response
            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    score: result.score || 0,
                    sentiment: result.sentiment || 'Neutral',
                    strength: result.strength || 'Low'
                };
            }

            return { score: 0, sentiment: 'Neutral', strength: 'Low' };
        } catch (error: any) {
            logger.error(`Sentiment analysis failed: ${error.message}`);
            return { score: 0, sentiment: 'Neutral', strength: 'Low' };
        }
    }

    private formatBullets(text: string): string[] {
        // Split by newlines and filter for bullets
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))
            .map(line => line.replace(/^[\-•\*]\s*/, '').trim())
            .slice(0, 5); // Max 5 bullets as per rules
    }

    private generateMockExplanation(symbol: string, signal: string, reasons: string[]): string[] {
        return [
            `Technical indicators currently support a ${signal} bias for ${symbol}.`,
            `Momentum and trend alignment factors are contributing to this outlook.`,
            `Correlation with benchmark assets remains a key variable.`,
            `Volatility levels are within expected parameters.`,
            `Overall confidence is derived from a multi-factor analysis.`
        ];
    }
}

export const aiService = new AIService();

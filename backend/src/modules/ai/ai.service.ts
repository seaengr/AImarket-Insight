import axios from 'axios';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import { PromptBuilder } from './prompt.builder';

export class AIService {
    /**
     * Generates a natural language explanation for the signal.
     * Uses real AI (HuggingFace) if configured, else mock.
     */
    async explainSignal(symbol: string, signal: string, reasons: string[]): Promise<string[]> {
        if (config.ai.provider === 'mock') {
            return this.generateMockExplanation(symbol, signal, reasons);
        }

        try {
            logger.info(`Requesting AI explanation for ${symbol} via ${config.ai.provider}`);
            const prompt = PromptBuilder.buildExplanationPrompt(symbol, signal, reasons);

            // Ollama Support
            if (config.ai.provider === 'ollama') {
                const response = await axios.post(config.ai.ollamaUrl, {
                    model: config.ai.model,
                    prompt: prompt,
                    stream: false,
                }, { timeout: 10000 });
                return [response.data.response || ''];
            }

            // Fallback for HuggingFace if no API key
            if (!config.ai.apiKey) {
                return this.generateMockExplanation(symbol, signal, reasons);
            }

            const response = await axios.post(
                `https://api-inference.huggingface.co/models/${config.ai.model}`,
                { inputs: prompt },
                {
                    headers: { Authorization: `Bearer ${config.ai.apiKey}` },
                    timeout: 5000,
                }
            );

            // HuggingFace Inference API returns an array of objects
            const aiText = response.data[0]?.generated_text || '';

            // Extract the explanation part (removing the prompt if model echoes it)
            const cleanText = aiText.replace(prompt, '').trim();

            return cleanText ? [cleanText] : this.generateMockExplanation(symbol, signal, reasons);
        } catch (error: any) {
            logger.error(`AI explanation failed (${error.message}), falling back to mock`);
            return this.generateMockExplanation(symbol, signal, reasons);
        }
    }

    private generateMockExplanation(symbol: string, signal: string, reasons: string[]): string[] {
        return [
            `Analysis of ${symbol} suggests a ${signal} bias based on technical indicators.`,
            ...reasons,
            `AI context: Current market sentiment aligns with ${signal === 'BUY' ? 'bullish' : 'bearish'} technical rules.`
        ];
    }
}

export const aiService = new AIService();

import axios from 'axios';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import { PromptBuilder } from './prompt.builder';
import { AnalysisResponse } from '../../types/api.types';

export class AIService {
    /**
     * Generates a natural language explanation for the signal.
     * Uses real AI (HuggingFace) if configured, else mock.
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

            // Ollama Support
            if (config.ai.provider === 'ollama') {
                const response = await axios.post(config.ai.ollamaUrl, {
                    model: config.ai.model,
                    prompt: prompt,
                    stream: false,
                }, { timeout: 60000 });

                const rawText = response.data.response || '';
                return this.formatBullets(rawText);
            }

            // Fallback for HuggingFace if no API key
            if (!config.ai.apiKey) {
                return this.generateMockExplanation(symbol, signal, []);
            }

            const response = await axios.post(
                `https://api-inference.huggingface.co/models/${config.ai.model}`,
                { inputs: prompt },
                {
                    headers: { Authorization: `Bearer ${config.ai.apiKey}` },
                    timeout: 5000,
                }
            );

            const aiText = response.data[0]?.generated_text || '';
            const cleanText = aiText.replace(prompt, '').trim();

            return cleanText ? this.formatBullets(cleanText) : this.generateMockExplanation(symbol, signal, []);
        } catch (error: any) {
            logger.error(`AI explanation failed (${error.message}), falling back to mock`);
            return this.generateMockExplanation(symbol, signal, []);
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

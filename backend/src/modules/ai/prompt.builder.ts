export class PromptBuilder {
    /**
     * Builds a professional trading analysis prompt
     */
    static buildExplanationPrompt(symbol: string, signal: string, reasons: string[]): string {
        const reasonsList = reasons.map(r => `- ${r}`).join('\n');

        return `
You are an expert financial analyst. Explain the following trading signal in a concise, professional manner.
Symbol: ${symbol}
Recommended Action: ${signal}
Technical Reasons:
${reasonsList}

Provide a 3-sentence summary explaining the logic behind this signal. Do not give financial advice.
    `.trim();
    }
}

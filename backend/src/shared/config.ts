import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    ai: {
        provider: process.env.AI_PROVIDER || 'huggingface', // 'mock' | 'huggingface' | 'ollama' | 'gemini'
        apiKey: process.env.AI_API_KEY || '',
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.AI_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
        ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434/api/generate',
    },
    market: {
        fallbackMode: true, // Use mock data if API limits reached
        alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
    },
    cors: {
        origin: '*', // For development, update to extension ID in production
    }
};

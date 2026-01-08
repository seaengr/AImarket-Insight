import { Request, Response } from 'express';
import { z } from 'zod';
import { marketService } from '../modules/market/market.service';
import { signalService } from '../modules/signal/signal.service';
import { aiService } from '../modules/ai/ai.service';
import { logger } from '../shared/logger';
import { AnalysisResponse } from '../types/api.types';

const AnalysisSchema = z.object({
    symbol: z.string().min(1),
    compareSymbol: z.string().optional(),
    timeframe: z.string().default('1H'),
    includeAi: z.boolean().default(true)
});

export const analyzeController = async (req: Request, res: Response) => {
    try {
        const { symbol, compareSymbol, timeframe, includeAi } = AnalysisSchema.parse(req.body);
        const compareTo = compareSymbol || symbol;

        // 1. Fetch Market Data
        const marketData = await marketService.getMarketData(symbol);
        const correlation = marketService.getCorrelation(symbol, compareTo);

        // 2. Compute Signal
        const signalResult = signalService.generateSignal(marketData, correlation);
        const levels = signalService.calculateLevels(marketData.price, signalResult.type);

        // 3. Construct Initial Response (needed for AI)
        const analysisResponse: AnalysisResponse = {
            marketInfo: {
                symbol,
                compareAsset: compareTo,
                timeframe
            },
            signal: {
                type: signalResult.type,
                confidence: signalResult.confidence,
                breakdown: signalResult.breakdown
            },
            levels,
            explanation: [],
            timestamp: Date.now(),
            metadata: {
                momentum: marketData.momentum,
                volatility: marketData.volatility,
                correlationValue: correlation,
                newsSentiment: marketData.newsSentiment?.sentiment || 'Neutral',
                newsStrength: marketData.newsSentiment?.strength || 'Low'
            }
        };

        // 4. Generate AI Explanation
        if (includeAi) {
            analysisResponse.explanation = await aiService.explainSignal(analysisResponse);
        }

        res.json(analysisResponse);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        logger.error(`Analysis failed: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

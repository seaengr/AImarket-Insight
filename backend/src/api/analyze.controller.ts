import { Request, Response } from 'express';
import { z } from 'zod';
import { marketService } from '../modules/market/market.service';
import { signalService } from '../modules/signal/signal.service';
import { aiService } from '../modules/ai/ai.service';
import { logger } from '../shared/logger';
import { AnalysisResponse } from '../types/api.types';

const AnalyzeSchema = z.object({
    symbol: z.string().min(1),
    compareSymbol: z.string().optional().default('BTCUSD'),
    timeframe: z.string().optional().default('1H'),
});

export const analyzeSymbol = async (req: Request, res: Response) => {
    try {
        // 1. Validate Input
        const { symbol, compareSymbol, timeframe } = AnalyzeSchema.parse(req.body);
        logger.info(`New analysis request: ${symbol} (vs ${compareSymbol}) [${timeframe}]`);

        // 2. Fetch Market Data
        const marketData = await marketService.getMarketData(symbol);
        const correlation = marketService.getCorrelation(symbol, compareSymbol);

        // 3. Generate Signal (Deterministic)
        const signalResult = signalService.generateSignal(marketData, correlation);
        const levels = signalService.calculateLevels(marketData.price, signalResult.type);

        // 4. Generate AI Explanation
        const explanation = await aiService.explainSignal(
            symbol,
            signalResult.type,
            signalResult.reasons
        );

        // 5. Construct Response
        const response: AnalysisResponse = {
            marketInfo: {
                symbol,
                compareAsset: compareSymbol,
                timeframe,
            },
            signal: {
                type: signalResult.type,
                confidence: signalResult.confidence,
            },
            levels,
            explanation,
            timestamp: Date.now(),
        };

        res.json(response);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
        }
        logger.error(error as any, 'Analysis failed');
        res.status(500).json({ error: 'Internal server error during analysis' });
    }
};

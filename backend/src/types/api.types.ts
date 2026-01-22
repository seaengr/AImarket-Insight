export interface MarketData {
    symbol: string;
    price: number;
    change24h: number;
    indicators: {
        rsi: number;
        ema9: number;
        ema21: number;
        ema20: number; // Keeping for backward compatibility
        ema50: number;
        ema200: number;
        macd?: {
            value: number;
            signal: number;
            histogram: number;
        };
        adx?: number;
    };
    mtfTrend: {
        '5m': string;
        '15m': string;
        '1H': string;
        '4H': string;
        '1D': string;
    };
    momentum: string;
    volatility: string;
    riskSentiment: 'Risk-On' | 'Risk-Off' | 'Neutral';
    correlation: number;
    emaExtension?: number; // % distance from EMA 21
    mirrorPrice?: number;  // Price of the inversely correlated asset (XAU vs BTC)
    newsSentiment?: {
        sentiment: string;
        strength: string;
        score?: number;
    };
}

export interface AnalysisRequest {
    symbol: string;
    compareSymbol?: string;
    timeframe: string;
}

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface ConfidenceBreakdown {
    trend: number;
    correlation: number;
    momentum: number;
    volatility: number;
    news: number;
}

export interface AnalysisResponse {
    marketInfo: {
        symbol: string;
        compareAsset: string;
        timeframe: string;
    };
    signal: {
        type: SignalType;
        confidence: number;
        breakdown: ConfidenceBreakdown;
    };
    levels: {
        entryZone: { low: number; high: number };
        takeProfit: { tp1: number; tp2: number; tp3?: number };
        stopLoss: number;
    };
    explanation: string[];
    timestamp: number;
    metadata: {
        momentum: string;
        volatility: string;
        correlationValue: number;
        riskSentiment: string;
        newsSentiment: string;
        newsStrength: string;
        emaExtension?: number;
        mirrorPrice?: number;
    };
}

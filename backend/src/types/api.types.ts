export interface MarketData {
    symbol: string;
    price: number;
    change24h: number;
    indicators: {
        rsi: number;
        ema20: number;
        ema50: number;
    };
}

export interface AnalysisRequest {
    symbol: string;
    compareSymbol?: string;
    timeframe: string;
}

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface AnalysisResponse {
    marketInfo: {
        symbol: string;
        compareAsset: string;
        timeframe: string;
    };
    signal: {
        type: SignalType;
        confidence: number;
    };
    levels: {
        entryZone: { low: number; high: number };
        takeProfit: { tp1: number; tp2: number; tp3?: number };
        stopLoss: number;
    };
    explanation: string[];
    timestamp: number;
}

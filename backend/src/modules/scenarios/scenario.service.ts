
import fs from 'fs';
import path from 'path';
import { logger } from '../../shared/logger';
import { SignalType } from '../../types/api.types';

export interface MarketScenario {
    id: string;
    timestamp: number;
    symbol: string;
    technicals: {
        trend: 'Bullish' | 'Bearish' | 'Neutral';
        rsi: number;
        emaDistance: number; // Percentage
    };
    fundamentals: {
        headlines: string[];
    };
    outcome: {
        result: 'WIN' | 'LOSS' | 'PENDING';
        pips: number;
    };
}

export class ScenarioService {
    private dbPath: string;

    constructor() {
        this.dbPath = path.join(process.cwd(), 'data', 'scenarios.json');
        this.ensureDb();
    }

    private ensureDb() {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(this.dbPath)) fs.writeFileSync(this.dbPath, JSON.stringify([]));
    }

    private readDb(): MarketScenario[] {
        try {
            return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        } catch (error) {
            return [];
        }
    }

    async saveScenario(scenario: Omit<MarketScenario, 'id' | 'timestamp'>) {
        const db = this.readDb();
        const newEntry: MarketScenario = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            ...scenario
        };
        db.push(newEntry);
        fs.writeFileSync(this.dbPath, JSON.stringify(db, null, 2));
        logger.info(`[Memory] Saved new market scenario for ${scenario.symbol}`);
    }

    /**
     * Finds scenarios that look similar to the current market condition.
     * Similarity based on: Trend Match + RSI proximity (+- 10) + News Keyword overlap
     */
    findSimilarScenarios(current: { symbol: string, rsi: number, trend: string, headlines: string[] }): MarketScenario[] {
        const db = this.readDb();

        return db.filter(s => {
            // 1. Symbol Match (Optional, maybe we want cross-asset patterns? For now, strict.)
            if (s.symbol !== current.symbol) return false;

            // 2. Trend Match
            if (s.technicals.trend !== current.trend) return false;

            // 3. RSI Match (within 10 points)
            if (Math.abs(s.technicals.rsi - current.rsi) > 10) return false;

            // 4. News Match (At least 1 matching keyword in headlines) - Simple MVP
            // This is a basic "fuzzy match"
            const currentKeywords = current.headlines.join(' ').toLowerCase().split(' ');
            const pastKeywords = s.fundamentals.headlines.join(' ').toLowerCase();
            const hasNewsOverlap = currentKeywords.some(k => k.length > 4 && pastKeywords.includes(k));

            return hasNewsOverlap;
        });
    }
}

export const scenarioService = new ScenarioService();

/**
 * Type definitions for UI state and data structures
 * These types are designed to be future-proof for AI integration
 */

import { SIGNAL_TYPES, TIMEFRAMES } from '../../shared/constants';

// Signal type union
export type SignalType = typeof SIGNAL_TYPES[keyof typeof SIGNAL_TYPES];

// Timeframe type union
export type Timeframe = typeof TIMEFRAMES[number];

// Market information
export interface MarketInfo {
    symbol: string;
    compareAsset: string;
    timeframe: Timeframe;
}

// Trading signal
export interface Signal {
    type: SignalType;
    confidence: number; // 0-100
}

// Entry zone range
export interface EntryZone {
    low: number;
    high: number;
}

// Take profit levels
export interface TakeProfitLevels {
    tp1: number;
    tp2: number;
    tp3?: number; // Optional third target
}

// All trade levels
export interface TradeLevels {
    entryZone: EntryZone;
    takeProfit: TakeProfitLevels;
    stopLoss: number;
}

// Journal Signal Log (Matches backend)
export interface JournalSignal {
    id: string;
    timestamp: number;
    symbol: string;
    type: SignalType;
    price: number;
    confidence: number;
    outcome: 'WIN' | 'LOSS' | 'PENDING';
}

// Journal Statistics
export interface JournalStats {
    winRate: number;
    totalTrades: number;
    wins: number;
    losses: number;
    scope: 'local' | 'global';
}

// Complete market analysis (future AI integration point)
export interface MarketMetadata {
    momentum: string;
    volatility: string;
    correlationValue: number;
    riskSentiment: 'Risk-On' | 'Risk-Off' | 'Neutral';
    newsSentiment: string;
    newsStrength: string;
    emaExtension?: number;
    mirrorPrice?: number;
    atrValue?: number;
    sltpReasoning?: string;
    strategyMode?: 'Sniper' | 'Scalper';
}

export interface MarketAnalysis {
    marketInfo: MarketInfo;
    signal: Signal;
    levels: TradeLevels;
    explanation: string[];
    metadata?: MarketMetadata;
    timestamp?: number;
}

// Panel visibility states
export interface PanelVisibility {
    entryZone: boolean;
    takeProfit: boolean;
    stopLoss: boolean;
}

// Risk Settings
export interface RiskSettings {
    accountBalance: number;
    riskPercent: number;
}

// Panel UI state
export interface PanelState {
    isVisible: boolean;
    isMinimized: boolean;
    isSettingsOpen: boolean;
    isExplanationExpanded: boolean;
    activeTab: 'Analysis' | 'Journal';
    position: {
        top: number;
        left: number;
    };
    visibility: PanelVisibility;
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number; // In seconds
    isVisionEnabled: boolean;
}

// Complete UI store state
export interface UIState {
    panel: PanelState;
    analysis: MarketAnalysis;
    journal: {
        stats: JournalStats | null;
        history: JournalSignal[];
    };
    risk: RiskSettings;
    isLoading: boolean;
    error: string | null;
}

// Store subscriber callback
export type Subscriber = () => void;

// Store actions (for future extensibility)
export interface UIActions {
    togglePanel: () => void;
    toggleMinimize: () => void;
    toggleSettings: () => void;
    toggleExplanation: () => void;
    setActiveTab: (tab: 'Analysis' | 'Journal') => void;
    setPosition: (top: number, left: number) => void;
    toggleVisibility: (section: keyof PanelVisibility) => void;
    updateAnalysis: (analysis: Partial<MarketAnalysis>) => void;
    updateRiskSettings: (settings: Partial<RiskSettings>) => void;
    toggleVision: () => void;
    fetchJournal: () => Promise<void>;
}

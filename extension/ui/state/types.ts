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

// Complete market analysis (future AI integration point)
export interface MarketAnalysis {
    marketInfo: MarketInfo;
    signal: Signal;
    levels: TradeLevels;
    explanation: string[];
    timestamp?: number;
}

// Panel visibility states
export interface PanelVisibility {
    entryZone: boolean;
    takeProfit: boolean;
    stopLoss: boolean;
}

// Panel UI state
export interface PanelState {
    isVisible: boolean;
    isMinimized: boolean;
    isSettingsOpen: boolean;
    isExplanationExpanded: boolean;
    position: {
        top: number;
        left: number;
    };
    visibility: PanelVisibility;
}

// Complete UI store state
export interface UIState {
    panel: PanelState;
    analysis: MarketAnalysis;
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
    setPosition: (top: number, left: number) => void;
    toggleVisibility: (section: keyof PanelVisibility) => void;
    updateAnalysis: (analysis: Partial<MarketAnalysis>) => void;
}

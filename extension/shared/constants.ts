/**
 * Application-wide constants
 * All magic numbers and strings should be defined here
 */

// Extension identification
export const EXTENSION_ID = 'ai-market-insight';
export const EXTENSION_NAME = 'AI Market Insight';

// Panel dimensions
export const PANEL_WIDTH = 320;
export const PANEL_MIN_HEIGHT = 100;
export const PANEL_MAX_HEIGHT = 800;
export const PANEL_MARGIN = 16;

// Z-index layers
export const Z_INDEX = {
  overlay: 9999,
  panel: 10000,
  modal: 10001,
  tooltip: 10002,
} as const;

// Animation durations (ms)
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// Default panel position
export const DEFAULT_POSITION = {
  top: 100,
  left: 800, // Near right side by default
} as const;

// Signal types
export const SIGNAL_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
  HOLD: 'HOLD',
} as const;

// Timeframe options
export const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'] as const;

// Mock data for UI demonstration
export const MOCK_DATA = {
  marketInfo: {
    symbol: 'XAUUSD',
    compareAsset: 'BTC',
    timeframe: '1H',
  },
  signal: {
    type: SIGNAL_TYPES.BUY,
    confidence: 78,
  },
  levels: {
    entryZone: {
      low: 2045.50,
      high: 2052.80,
    },
    takeProfit: {
      tp1: 2068.40,
      tp2: 2085.90,
    },
    stopLoss: 2038.20,
  },
  explanation: [
    'Strong bullish momentum detected on higher timeframes',
    'Price holding above key support at 2040',
    'Volume increase confirms buyer interest',
    'RSI showing bullish divergence',
  ],
} as const;

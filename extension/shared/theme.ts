/**
 * Theme configuration
 * All colors, typography, spacing, and visual tokens
 */

export const colors = {
    // Base colors
    background: {
        primary: '#0f1419',
        secondary: '#1a1f2e',
        tertiary: '#242b3d',
        hover: '#2a3347',
    },

    // Text colors
    text: {
        primary: '#ffffff',
        secondary: '#8b95a5',
        muted: '#5d6778',
    },

    // Border colors
    border: {
        primary: '#2a3347',
        secondary: '#3d4659',
        focus: '#4a90d9',
    },

    // Signal colors
    signal: {
        buy: '#00c853',
        buyLight: '#00e676',
        buyDark: '#00a040',
        sell: '#ff5252',
        sellLight: '#ff6b6b',
        sellDark: '#d32f2f',
        hold: '#ffc107',
        holdLight: '#ffd54f',
        holdDark: '#f9a825',
    },

    // Accent colors
    accent: {
        primary: '#4a90d9',
        secondary: '#7c4dff',
        success: '#00c853',
        warning: '#ffc107',
        error: '#ff5252',
    },

    // Toggle colors
    toggle: {
        active: '#00c853',
        inactive: '#5d6778',
        track: '#2a3347',
    },
} as const;

export const typography = {
    fontFamily: {
        primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },

    fontSize: {
        xs: '10px',
        sm: '12px',
        base: '14px',
        lg: '16px',
        xl: '20px',
        xxl: '24px',
        xxxl: '32px',
    },

    fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

export const spacing = {
    xxs: '4px',
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '32px',
} as const;

export const borderRadius = {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
} as const;

export const shadows = {
    sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.4)',
    glow: {
        buy: '0 0 20px rgba(0, 200, 83, 0.3)',
        sell: '0 0 20px rgba(255, 82, 82, 0.3)',
        hold: '0 0 20px rgba(255, 193, 7, 0.3)',
    },
} as const;

export const transitions = {
    fast: 'all 0.15s ease',
    normal: 'all 0.25s ease',
    slow: 'all 0.4s ease',
    bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Complete theme object
export const theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    transitions,
} as const;

export type Theme = typeof theme;
export default theme;

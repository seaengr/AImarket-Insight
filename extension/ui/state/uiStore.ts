/**
 * UI State Store
 * Simple pub/sub state management for the panel
 */

import { MOCK_DATA, DEFAULT_POSITION, API_URL } from '../../shared/constants';
import type { UIState, Subscriber, PanelVisibility, MarketAnalysis } from './types';

// Initial state
const createInitialState = (): UIState => ({
    panel: {
        isVisible: true,
        isMinimized: false,
        isSettingsOpen: false,
        isExplanationExpanded: false,
        position: { ...DEFAULT_POSITION },
        visibility: {
            entryZone: true,
            takeProfit: true,
            stopLoss: true,
        },
        autoRefreshEnabled: true,
        autoRefreshInterval: 300, // 5 minutes default
    },
    analysis: {
        marketInfo: { ...MOCK_DATA.marketInfo },
        signal: { ...MOCK_DATA.signal },
        levels: {
            entryZone: { ...MOCK_DATA.levels.entryZone },
            takeProfit: { ...MOCK_DATA.levels.takeProfit },
            stopLoss: MOCK_DATA.levels.stopLoss,
        },
        explanation: [...MOCK_DATA.explanation],
        timestamp: Date.now(),
    },
    isLoading: false,
    error: null,
});

// Store implementation
class UIStore {
    private state: UIState;
    private subscribers: Set<Subscriber> = new Set();

    constructor() {
        this.state = createInitialState();
    }

    // Get current state (immutable copy)
    getState(): UIState {
        return { ...this.state };
    }

    // Subscribe to state changes
    subscribe(callback: Subscriber): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Notify all subscribers
    private notify(): void {
        this.subscribers.forEach((callback) => callback());
    }

    // Update state
    private setState(updater: (state: UIState) => UIState): void {
        this.state = updater(this.state);
        this.notify();
    }

    // Panel actions
    togglePanel(): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, isVisible: !state.panel.isVisible },
        }));
    }

    toggleMinimize(): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, isMinimized: !state.panel.isMinimized },
        }));
    }

    toggleSettings(): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, isSettingsOpen: !state.panel.isSettingsOpen },
        }));
    }

    toggleExplanation(): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, isExplanationExpanded: !state.panel.isExplanationExpanded },
        }));
    }

    setPosition(top: number, left: number): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, position: { top, left } },
        }));
    }

    // Actions for auto-refresh
    toggleAutoRefresh(): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, autoRefreshEnabled: !state.panel.autoRefreshEnabled },
        }));
    }

    setAutoRefreshInterval(seconds: number): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, autoRefreshInterval: seconds },
        }));
    }

    toggleVisibility(section: keyof PanelVisibility): void {
        this.setState((state) => ({
            ...state,
            panel: {
                ...state.panel,
                visibility: {
                    ...state.panel.visibility,
                    [section]: !state.panel.visibility[section],
                },
            },
        }));
    }

    // Analysis updates (Integrated with Backend)
    async fetchAnalysis(symbol: string, timeframe: string, price: number | null = null): Promise<void> {
        this.setLoading(true);
        this.setError(null);

        try {
            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, timeframe, price })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch analysis from backend');
            }

            const data = await response.json();
            this.updateAnalysis(data);
        } catch (error: any) {
            console.error('[AI Market Insight] Analysis error:', error);
            this.setError(error.message || 'An unexpected error occurred');
        } finally {
            this.setLoading(false);
        }
    }

    updateAnalysis(analysis: Partial<MarketAnalysis>): void {
        this.setState((state) => ({
            ...state,
            analysis: { ...state.analysis, ...analysis, timestamp: Date.now() },
        }));
    }

    setLoading(isLoading: boolean): void {
        this.setState((state) => ({ ...state, isLoading }));
    }

    setError(error: string | null): void {
        this.setState((state) => ({ ...state, error }));
    }

    // Reset to initial state
    reset(): void {
        this.state = createInitialState();
        this.notify();
    }
}

// Export singleton instance
export const uiStore = new UIStore();
export default uiStore;

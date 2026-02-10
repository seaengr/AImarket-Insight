/**
 * UI State Store
 * Simple pub/sub state management for the panel
 */

import { MOCK_DATA, DEFAULT_POSITION, API_URL } from '../../shared/constants';
import { triggerSignalAlert } from '../../shared/alerts';
import type { UIState, Subscriber, PanelVisibility, MarketAnalysis, RiskSettings } from './types';

// Initial state
const createInitialState = (): UIState => ({
    panel: {
        isVisible: true,
        isMinimized: false,
        isSettingsOpen: false,
        isExplanationExpanded: false,
        activeTab: 'Analysis',
        position: { ...DEFAULT_POSITION },
        visibility: {
            entryZone: true,
            takeProfit: true,
            stopLoss: true,
        },
        autoRefreshEnabled: true,
        autoRefreshInterval: 300, // 5 minutes default
        isVisionEnabled: false,
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
    journal: {
        stats: null,
        history: [],
    },
    risk: {
        accountBalance: 1000,
        riskPercent: 1,
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

    setActiveTab(tab: 'Analysis' | 'Journal'): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, activeTab: tab },
        }));

        if (tab === 'Journal') {
            this.fetchJournal();
        }
    }

    updateRiskSettings(settings: Partial<RiskSettings>): void {
        this.setState((state) => ({
            ...state,
            risk: { ...state.risk, ...settings }
        }));
    }

    toggleVision(): void {
        this.setState((state) => ({
            ...state,
            panel: { ...state.panel, isVisionEnabled: !state.panel.isVisionEnabled }
        }));
    }

    private async captureScreenshot(): Promise<string | null> {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'CAPTURE_SCREEN' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('[Vision] Capture failed:', chrome.runtime.lastError.message);
                    resolve(null);
                } else if (response && response.success) {
                    resolve(response.dataUrl);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Analysis updates (Integrated with Backend)
    // ... (fetchAnalysis method remains the same)

    async fetchJournal(): Promise<void> {
        this.setLoading(true);
        try {
            const currentSymbol = this.state.analysis.marketInfo.symbol;

            // 1. Fetch Stats
            const statsResult: any = await this.proxyFetch(`${API_URL}/journal/stats?symbol=${currentSymbol}`);

            // 2. Fetch History
            const historyResult: any = await this.proxyFetch(`${API_URL}/journal/trades?limit=20`);

            this.setState((state) => ({
                ...state,
                journal: {
                    stats: statsResult,
                    history: historyResult,
                }
            }));
        } catch (error: any) {
            console.error('[AI Market Insight] Failed to fetch journal:', error);
        } finally {
            this.setLoading(false);
        }
    }

    private async proxyFetch(url: string, options: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'FETCH_ANALYSIS',
                payload: { url, options }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response?.error || 'Unknown background error'));
                }
            });
        });
    }

    // Analysis updates (Integrated with Backend)
    async fetchAnalysis(symbol: string, timeframe: string, price: number | null = null): Promise<void> {
        // Clear old analysis if symbol changed to prevent "phantom" signals
        if (this.state.analysis.marketInfo.symbol !== symbol) {
            this.updateAnalysis({
                marketInfo: { symbol, timeframe: timeframe as any, compareAsset: symbol },
                signal: { type: 'HOLD', confidence: 0 },
                levels: { entryZone: { low: 0, high: 0 }, takeProfit: { tp1: 0, tp2: 0, tp3: 0 }, stopLoss: 0 },
                explanation: ['Analyzing new market data...'],
                metadata: undefined
            });
        }

        this.setLoading(true);
        this.setError(null);

        try {
            // Capture screenshot if vision is enabled
            let screenshot = null;
            if (this.state.panel.isVisionEnabled) {
                screenshot = await this.captureScreenshot();
            }

            const data = await this.proxyFetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, timeframe, price, screenshot })
            });

            // Detect if signal changed and trigger alert
            const previousSignal = this.state.analysis.signal.type;
            const newSignal = data.signal?.type;

            if (newSignal && newSignal !== 'HOLD' && newSignal !== previousSignal) {
                triggerSignalAlert(
                    newSignal,
                    data.marketInfo?.symbol || 'Unknown',
                    data.signal?.confidence || 0
                );
            }

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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { uiStore } from './state/uiStore';
import type { UIState, PanelVisibility } from './state/types';
import { FloatingContainer } from './layout/FloatingContainer';
import { Panel } from './components/Panel/Panel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import styles from './components/Panel/Panel.module.css';
import { scrapeTradingViewData } from '../content/scraper';

/**
 * App component
 * Root component that composes the entire UI
 * Subscribes to store updates and pass state to children
 */
export const App: React.FC = () => {
    const [state, setState] = useState<UIState>(uiStore.getState());
    const lastSymbolRef = useRef<string>('');
    const lastRefreshTimeRef = useRef<number>(0);

    // Scrape and fetch analysis logic
    const refreshAnalysis = useCallback(async (force: boolean = false) => {
        const data = scrapeTradingViewData();
        if (!data) return;

        const now = Date.now();
        const symbolChanged = data.symbol !== lastSymbolRef.current;
        const autoRefreshDue = state.panel.autoRefreshEnabled &&
            (now - lastRefreshTimeRef.current > state.panel.autoRefreshInterval * 1000);

        if (force || symbolChanged || autoRefreshDue) {
            console.log(`[AI Market Insight] Refreshing analysis: ${symbolChanged ? 'Symbol changed' : 'Auto-refresh due'}`);
            lastSymbolRef.current = data.symbol;
            lastRefreshTimeRef.current = now;
            await uiStore.fetchAnalysis(data.symbol, data.timeframe, data.price);
        }
    }, [state.panel.autoRefreshEnabled, state.panel.autoRefreshInterval]);

    // Subscribe to store updates and handle initial scrape
    useEffect(() => {
        const unsubscribe = uiStore.subscribe(() => {
            setState(uiStore.getState());
        });

        // Initial scrape
        refreshAnalysis();

        // Periodic scrape (every 2 seconds for high responsiveness)
        // Auto-refresh disabled per user request - manual refresh only!
        // const interval = setInterval(refreshAnalysis, 2000);

        // Listen for messages from popup
        const handleMessage = (message: any) => {
            if (message.type === 'TOGGLE_PANEL') {
                uiStore.togglePanel();
                // Refresh on showing
                if (!uiStore.getState().panel.isVisible) {
                    refreshAnalysis();
                }
            }
        };

        // Listen for keyboard shortcuts (Alt+A)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'a') {
                uiStore.togglePanel();
                // Refresh on showing
                if (!uiStore.getState().panel.isVisible) {
                    refreshAnalysis();
                }
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            unsubscribe();
            // clearInterval(interval);
            chrome.runtime.onMessage.removeListener(handleMessage);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [refreshAnalysis]);

    // Event handlers - delegate to store
    const handleMinimize = useCallback(() => {
        uiStore.toggleMinimize();
    }, []);

    const handleSettings = useCallback(() => {
        uiStore.toggleSettings();
    }, []);

    const handleCloseSettings = useCallback(() => {
        uiStore.toggleSettings();
    }, []);

    const handleToggleSection = useCallback((section: keyof PanelVisibility) => {
        uiStore.toggleVisibility(section);
    }, []);

    const handleToggleExplanation = useCallback(() => {
        uiStore.toggleExplanation();
    }, []);

    const handlePositionChange = useCallback((top: number, left: number) => {
        uiStore.setPosition(top, left);
    }, []);

    const handleHide = useCallback(() => {
        uiStore.togglePanel();
    }, []);

    const handleToggleAutoRefresh = useCallback(() => {
        uiStore.toggleAutoRefresh();
    }, []);

    const handleSetAutoRefreshInterval = useCallback((seconds: number) => {
        uiStore.setAutoRefreshInterval(seconds);
    }, []);

    const handleReset = useCallback(() => {
        uiStore.reset();
    }, []);

    // Drag start handler - passed through to panel header
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        // Mark the header as a drag handle
        const target = e.currentTarget;
        target.setAttribute('data-drag-handle', 'true');
    }, []);

    return (
        <>
            <FloatingContainer
                initialPosition={state.panel.position}
                isMinimized={state.panel.isMinimized}
                onPositionChange={handlePositionChange}
            >
                {state.panel.isVisible ? (
                    <Panel
                        state={state}
                        onMinimize={handleMinimize}
                        onSettingsClick={handleSettings}
                        onRefresh={() => refreshAnalysis(true)}
                        onDragStart={handleDragStart}
                        onToggleSection={handleToggleSection}
                        onToggleExplanation={handleToggleExplanation}
                    />
                ) : (
                    <div
                        className={styles.panelMinimized}
                        onClick={handleHide}
                        title="Show AI Market Insight"
                        style={{ opacity: 0.7 }}
                        data-drag-handle="true"
                    >
                        <span
                            style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#4a90d9',
                                pointerEvents: 'none'
                            }}
                        >
                            AI
                        </span>
                    </div>
                )}
            </FloatingContainer>

            <SettingsPanel
                isOpen={state.panel.isSettingsOpen}
                visibility={state.panel.visibility}
                autoRefreshEnabled={state.panel.autoRefreshEnabled}
                autoRefreshInterval={state.panel.autoRefreshInterval}
                onClose={handleCloseSettings}
                onToggle={handleToggleSection}
                onToggleAutoRefresh={handleToggleAutoRefresh}
                onSetAutoRefreshInterval={handleSetAutoRefreshInterval}
                onReset={handleReset}
            />
        </>
    );
};

export default App;

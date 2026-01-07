import React, { useState, useEffect, useCallback } from 'react';
import { uiStore } from './state/uiStore';
import type { UIState, PanelVisibility } from './state/types';
import { FloatingContainer } from './layout/FloatingContainer';
import { Panel } from './components/Panel/Panel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import styles from './components/Panel/Panel.module.css';

/**
 * App component
 * Root component that composes the entire UI
 * Subscribes to store updates and pass state to children
 */
export const App: React.FC = () => {
    const [state, setState] = useState<UIState>(uiStore.getState());

    // Subscribe to store updates
    useEffect(() => {
        const unsubscribe = uiStore.subscribe(() => {
            setState(uiStore.getState());
        });

        // Listen for messages from popup
        const handleMessage = (message: any) => {
            if (message.type === 'TOGGLE_PANEL') {
                uiStore.togglePanel();
            }
        };

        // Listen for keyboard shortcuts (Alt+A)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'a') {
                uiStore.togglePanel();
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            unsubscribe();
            chrome.runtime.onMessage.removeListener(handleMessage);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

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
                        key="full-panel"
                        state={state}
                        onMinimize={handleMinimize}
                        onSettingsClick={handleSettings}
                        onHide={handleHide}
                        onDragStart={handleDragStart}
                        onToggleSection={handleToggleSection}
                        onToggleExplanation={handleToggleExplanation}
                    />
                ) : (
                    <div
                        key="minimized-trigger"
                        className={styles.panelMinimized}
                        onClick={handleHide}
                        title="Show AI Market Insight"
                        style={{ opacity: 0.9 }}
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#4a90d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
                            <path d="M12 8v8M8 12h8" strokeOpacity="0.8">
                                <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                            </path>
                            <circle cx="12" cy="12" r="3" fill="#4a90d9">
                                <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                    </div>
                )}
            </FloatingContainer>

            <SettingsPanel
                isOpen={state.panel.isSettingsOpen}
                visibility={state.panel.visibility}
                onClose={handleCloseSettings}
                onToggle={handleToggleSection}
                onReset={handleReset}
            />
        </>
    );
};

export default App;

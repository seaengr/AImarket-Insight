import React, { useState, useEffect, useCallback } from 'react';
import { uiStore } from './state/uiStore';
import type { UIState, PanelVisibility } from './state/types';
import { FloatingContainer } from './layout/FloatingContainer';
import { Panel } from './components/Panel/Panel';
import { SettingsPanel } from './components/Settings/SettingsPanel';

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
        return unsubscribe;
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

    const handlePositionChange = useCallback((top: number, right: number) => {
        uiStore.setPosition(top, right);
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

    // Don't render if panel is not visible
    if (!state.panel.isVisible) {
        return null;
    }

    return (
        <>
            <FloatingContainer
                initialPosition={state.panel.position}
                isMinimized={state.panel.isMinimized}
                onPositionChange={handlePositionChange}
            >
                <Panel
                    state={state}
                    onMinimize={handleMinimize}
                    onSettingsClick={handleSettings}
                    onDragStart={handleDragStart}
                    onToggleSection={handleToggleSection}
                    onToggleExplanation={handleToggleExplanation}
                />
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

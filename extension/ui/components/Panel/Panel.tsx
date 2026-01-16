import React from 'react';
import { cn } from '../../../shared/utils';
import { EXTENSION_NAME } from '../../../shared/constants';
import type { UIState } from '../../state/types';
import { PanelHeader } from './PanelHeader';
import { PanelSection } from './PanelSection';
import { SignalBadge } from '../Signal/SignalBadge';
import { ConfidenceMeter } from '../Signal/ConfidenceMeter';
import { EntryZone } from '../Levels/EntryZone';
import { TakeProfit } from '../Levels/TakeProfit';
import { StopLoss } from '../Levels/StopLoss';
import styles from './Panel.module.css';

interface PanelProps {
    state: UIState;
    onMinimize: () => void;
    onSettingsClick: () => void;
    onRefresh: () => void;
    onDragStart: (e: React.MouseEvent) => void;
    onToggleSection: (section: 'entryZone' | 'takeProfit' | 'stopLoss') => void;
    onToggleExplanation: () => void;
}

/**
 * Panel component
 * Main container for the market insight panel
 * Orchestrates all sub-components
 */
export const Panel: React.FC<PanelProps> = ({
    state,
    onMinimize,
    onSettingsClick,
    onRefresh,
    onDragStart,
    onToggleSection,
    onToggleExplanation,
}) => {
    const { panel, analysis } = state;

    // Minimized state - show only icon
    if (panel.isMinimized) {
        return (
            <div
                className={cn(styles.panel, styles.panelMinimized)}
                onClick={onMinimize}
                data-drag-handle="true"
            >
                <svg className={styles.minimizedIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {/* Brain outline */}
                    <path d="M12 4.5c-1.5-1-3.5-1-5 0s-2.5 3-2 5c-1 1-1.5 2.5-1 4s2 2.5 3.5 2.5c0 1.5 1 3 2.5 3.5s3-.5 4-2c1 1.5 2.5 2.5 4 2s2.5-2 2.5-3.5c1.5 0 3-1 3.5-2.5s0-3-1-4c.5-2-.5-4-2-5s-3.5-1-5 0" strokeLinecap="round" />
                    {/* Upward trend arrow */}
                    <path d="M7 15l4-4 2 2 4-5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="#00d4aa" />
                    <path d="M14 8h3v3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="#00d4aa" />
                </svg>
            </div>
        );
    }

    return (
        <div className={styles.panel}>
            <PanelHeader
                title={EXTENSION_NAME}
                onSettingsClick={onSettingsClick}
                onMinimizeClick={onMinimize}
                onRefreshClick={onRefresh}
                onDragStart={onDragStart}
            />

            <div className={styles.panelContent}>
                {state.isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner} />
                        <span className={styles.loadingText}>Analyzing {analysis.marketInfo.symbol}...</span>
                    </div>
                )}

                {state.error && (
                    <div className={styles.errorBanner}>
                        <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <div className={styles.errorContent}>
                            <span className={styles.errorTitle}>Connection Error</span>
                            <span className={styles.errorMessage}>{state.error}</span>
                        </div>
                    </div>
                )}
                {/* Market Info Section */}
                <div className={styles.section}>
                    <div className={styles.marketInfoGrid}>
                        <div className={styles.marketInfoItem}>
                            <span className={styles.marketInfoLabel}>Symbol</span>
                            <span className={styles.marketInfoValue}>{analysis.marketInfo.symbol}</span>
                        </div>
                        <div className={styles.marketInfoItem}>
                            <span className={styles.marketInfoLabel}>Compare</span>
                            <span className={styles.marketInfoValue}>{analysis.marketInfo.compareAsset}</span>
                        </div>
                        <div className={styles.marketInfoItem}>
                            <span className={styles.marketInfoLabel}>Timeframe</span>
                            <span className={styles.marketInfoValue}>{analysis.marketInfo.timeframe}</span>
                        </div>
                    </div>
                </div>

                {/* Signal Section */}
                <div className={styles.section}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span className={styles.marketInfoLabel}>Bias</span>
                            <SignalBadge type={analysis.signal.type} />
                        </div>
                        <ConfidenceMeter value={analysis.signal.confidence} />
                    </div>
                </div>

                {/* Entry Zone Section */}
                <PanelSection
                    title="Entry Zone"
                    showToggle
                    isActive={panel.visibility.entryZone}
                    onToggle={() => onToggleSection('entryZone')}
                >
                    <EntryZone
                        low={analysis.levels.entryZone.low}
                        high={analysis.levels.entryZone.high}
                    />
                </PanelSection>

                {/* Take Profit Section */}
                <PanelSection
                    title="Take Profit"
                    showToggle
                    isActive={panel.visibility.takeProfit}
                    onToggle={() => onToggleSection('takeProfit')}
                >
                    <TakeProfit
                        tp1={analysis.levels.takeProfit.tp1}
                        tp2={analysis.levels.takeProfit.tp2}
                        tp3={analysis.levels.takeProfit.tp3}
                    />
                </PanelSection>

                {/* Stop Loss Section */}
                <PanelSection
                    title="Stop Loss"
                    showToggle
                    isActive={panel.visibility.stopLoss}
                    onToggle={() => onToggleSection('stopLoss')}
                >
                    <StopLoss value={analysis.levels.stopLoss} />
                </PanelSection>

                {/* Explanation Section */}
                <button className={styles.expandButton} onClick={onToggleExplanation}>
                    <span>Why this signal?</span>
                    <svg
                        className={cn(styles.expandIcon, panel.isExplanationExpanded && styles.expanded)}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <polyline points="6,9 12,15 18,9" />
                    </svg>
                </button>

                {panel.isExplanationExpanded && (
                    <ul className={styles.explanationList}>
                        {analysis.explanation.map((item, index) => (
                            <li key={index} className={styles.explanationItem}>
                                {item}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Panel;

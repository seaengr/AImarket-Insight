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
    onHide: () => void;
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
    onHide,
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
                <svg className={styles.minimizedIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
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
                onCloseClick={onHide}
                onDragStart={onDragStart}
            />

            <div className={styles.panelContent}>
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

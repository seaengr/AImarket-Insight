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
                            <span className={styles.marketInfoLabel}>Price</span>
                            <span className={cn(
                                styles.marketInfoValue,
                                analysis.signal.type === 'BUY' && styles.bullishPrice,
                                analysis.signal.type === 'SELL' && styles.bearishPrice
                            )}>
                                {analysis.levels.stopLoss > 0 ? analysis.levels.entryZone.low.toFixed(2) : (state.analysis.marketInfo.symbol.includes('BTC') ? '...' : analysis.levels.entryZone.low || 'Loading')}
                            </span>
                        </div>
                        <div className={styles.marketInfoItem}>
                            <span className={styles.marketInfoLabel}>Timeframe</span>
                            <span className={styles.marketInfoValue}>{analysis.marketInfo.timeframe}</span>
                        </div>
                    </div>

                    {/* Mean Reversion Gauge (Visualizing Overextension) */}
                    {analysis.metadata?.emaExtension !== undefined && (
                        <div className={styles.gaugeContainer}>
                            <div className={styles.gaugeLabel}>
                                <span>EMA 21 STRETCH</span>
                                <span>{analysis.metadata.emaExtension.toFixed(2)}%</span>
                            </div>
                            <div className={styles.gaugeBar}>
                                <div
                                    className={cn(
                                        styles.gaugeLevel,
                                        Math.abs(analysis.metadata.emaExtension) > 3 ? styles.riskOff :
                                            Math.abs(analysis.metadata.emaExtension) > 1.5 ? styles.neutral : styles.riskOn
                                    )}
                                    style={{ width: `${Math.min(Math.abs(analysis.metadata.emaExtension) * 20, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Mirror Asset Tracker (Divergence Context) */}
                {analysis.metadata?.mirrorPrice !== undefined && analysis.metadata.correlationValue < 0 && (
                    <div className={styles.mirrorRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg className={styles.mirrorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span className={styles.mirrorSymbol}>
                                {analysis.marketInfo.symbol.includes('BTC') ? 'XAU' : 'BTC'} Mirror
                            </span>
                        </div>
                        <span className={styles.mirrorValue}>
                            {analysis.metadata.mirrorPrice > 0 ? `+${analysis.metadata.mirrorPrice.toFixed(2)}%` : `${analysis.metadata.mirrorPrice.toFixed(2)}%`}
                        </span>
                    </div>
                )}

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

                {/* Strategic Alerts Section */}
                {analysis.metadata && (
                    <div className={styles.section}>
                        <div className={styles.macroGrid}>
                            <div className={styles.macroItem}>
                                <span className={styles.marketInfoLabel}>Macro Regime</span>
                                <div className={cn(
                                    styles.macroBadge,
                                    analysis.metadata.riskSentiment === 'Risk-On' && styles.riskOn,
                                    analysis.metadata.riskSentiment === 'Risk-Off' && styles.riskOff
                                )}>
                                    {analysis.metadata.riskSentiment}
                                </div>
                            </div>
                            <div className={styles.macroItem}>
                                <span className={styles.marketInfoLabel}>Correlation</span>
                                <span className={styles.macroValue}>
                                    {(analysis.metadata.correlationValue * 100).toFixed(0)}%
                                    <span className={styles.macroSubtext}> vs Benchmark</span>
                                </span>
                            </div>
                        </div>

                        <div className={styles.strategicAlerts}>
                            {analysis.metadata.emaExtension && Math.abs(analysis.metadata.emaExtension) > 3 && (
                                <div className={cn(styles.alertBadge, styles.riskOff)}>
                                    <span>⚠️ RETRACEMENT RISK: Overextended</span>
                                </div>
                            )}
                            {analysis.metadata.mirrorPrice !== undefined && analysis.metadata.correlationValue < 0 && (
                                <div className={cn(styles.alertBadge, styles.neutral)} style={{ backgroundColor: 'rgba(98, 0, 234, 0.15)', color: '#b388ff' }}>
                                    <span>📡 DIVERGENCE: Mirror Mismatch</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Trade Levels Section (Only visible for BUY/SELL) */}
                {analysis.signal.type !== 'HOLD' && (
                    <>
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
                    </>
                )}

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

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
import { TradeJournal } from '../Journal/TradeJournal';
import { RiskCalculator } from '../Risk/RiskCalculator';
import styles from './Panel.module.css';

interface PanelProps {
    state: UIState;
    onMinimize: () => void;
    onSettingsClick: () => void;
    onRefresh: () => void;
    onDragStart: (e: React.MouseEvent) => void;
    onToggleSection: (section: 'entryZone' | 'takeProfit' | 'stopLoss') => void;
    onToggleExplanation: () => void;
    onTabChange: (tab: 'Analysis' | 'Journal') => void;
    onUpdateRisk: (settings: any) => void;
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
    onTabChange,
    onUpdateRisk,
}) => {
    const { panel, analysis, journal, risk } = state;

    // Minimized state - show only icon
    if (panel.isMinimized) {
        return (
            <div
                className={cn(styles.panel, styles.panelMinimized)}
                onClick={onMinimize}
                data-drag-handle="true"
            >
                <img
                    src={typeof chrome !== 'undefined' && chrome.runtime?.getURL ? chrome.runtime.getURL('imgicon128.png') : '/imgicon128.png'}
                    alt="Logo"
                    className={styles.minimizedIcon}
                    style={{ borderRadius: '50%' }}
                />
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

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={cn(styles.tab, panel.activeTab === 'Analysis' && styles.tabActive)}
                    onClick={() => onTabChange('Analysis')}
                >
                    Analysis
                </button>
                <button
                    className={cn(styles.tab, panel.activeTab === 'Journal' && styles.tabActive)}
                    onClick={() => onTabChange('Journal')}
                >
                    Journal
                </button>
            </div>

            <div className={styles.panelContent}>
                {state.isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner} />
                        <span className={styles.loadingText}>Loading...</span>
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

                {panel.activeTab === 'Analysis' ? (
                    <div className={styles.tabContent}>
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

                            {/* Mean Reversion Gauge */}
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

                        {/* Position Sizer (Risk Calculator) */}
                        {analysis.signal.type !== 'HOLD' && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>Position Sizer</h3>
                                </div>
                                <RiskCalculator
                                    settings={risk}
                                    analysis={analysis}
                                    onUpdateSettings={onUpdateRisk}
                                />
                            </div>
                        )}

                        {/* Trade Levels Section */}
                        {analysis.signal.type !== 'HOLD' && (
                            <>
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
                ) : (
                    <div className={styles.tabContent}>
                        <TradeJournal
                            stats={journal.stats}
                            history={journal.history}
                            onRefresh={() => onTabChange('Journal')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Panel;


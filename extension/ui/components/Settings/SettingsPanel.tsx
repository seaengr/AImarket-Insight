import React from 'react';
import { cn } from '../../../shared/utils';
import type { PanelVisibility } from '../../state/types';
import styles from './Settings.module.css';

interface SettingsPanelProps {
    isOpen: boolean;
    visibility: PanelVisibility;
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    onClose: () => void;
    onToggle: (section: keyof PanelVisibility) => void;
    onToggleAutoRefresh: () => void;
    onSetAutoRefreshInterval: (seconds: number) => void;
    onReset: () => void;
}

/**
 * SettingsPanel component
 * Modal for configuring overlay visibility and auto-refresh options
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    visibility,
    autoRefreshEnabled,
    autoRefreshInterval,
    onClose,
    onToggle,
    onToggleAutoRefresh,
    onSetAutoRefreshInterval,
    onReset,
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.settingsOverlay} onClick={handleOverlayClick}>
            <div className={styles.settingsPanel}>
                <div className={styles.settingsHeader}>
                    <h3 className={styles.settingsTitle}>Settings</h3>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.settingsContent}>
                    <div className={styles.settingsGroup}>
                        <div className={styles.settingsGroupTitle}>Chart Overlays</div>

                        <div className={styles.settingsItem}>
                            <span className={styles.settingsLabel}>Entry Zone</span>
                            <div
                                className={cn(styles.toggle, visibility.entryZone && styles.active)}
                                onClick={() => onToggle('entryZone')}
                                role="switch"
                                aria-checked={visibility.entryZone}
                                tabIndex={0}
                            >
                                <div className={styles.toggleKnob} />
                            </div>
                        </div>

                        <div className={styles.settingsItem}>
                            <span className={styles.settingsLabel}>Take Profit Levels</span>
                            <div
                                className={cn(styles.toggle, visibility.takeProfit && styles.active)}
                                onClick={() => onToggle('takeProfit')}
                                role="switch"
                                aria-checked={visibility.takeProfit}
                                tabIndex={0}
                            >
                                <div className={styles.toggleKnob} />
                            </div>
                        </div>

                        <div className={styles.settingsItem}>
                            <span className={styles.settingsLabel}>Stop Loss</span>
                            <div
                                className={cn(styles.toggle, visibility.stopLoss && styles.active)}
                                onClick={() => onToggle('stopLoss')}
                                role="switch"
                                aria-checked={visibility.stopLoss}
                                tabIndex={0}
                            >
                                <div className={styles.toggleKnob} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.settingsGroup}>
                        <div className={styles.settingsGroupTitle}>Automation</div>

                        <div className={styles.settingsItem}>
                            <span className={styles.settingsLabel}>Enable Auto Refresh</span>
                            <div
                                className={cn(styles.toggle, autoRefreshEnabled && styles.active)}
                                onClick={onToggleAutoRefresh}
                                role="switch"
                                aria-checked={autoRefreshEnabled}
                                tabIndex={0}
                            >
                                <div className={styles.toggleKnob} />
                            </div>
                        </div>

                        {autoRefreshEnabled && (
                            <div className={styles.settingsItem}>
                                <span className={styles.settingsLabel}>Interval</span>
                                <select
                                    className={styles.select}
                                    value={autoRefreshInterval}
                                    onChange={(e) => onSetAutoRefreshInterval(Number(e.target.value))}
                                >
                                    <option value={60}>1 Minute</option>
                                    <option value={300}>5 Minutes</option>
                                    <option value={600}>10 Minutes</option>
                                    <option value={1800}>30 Minutes</option>
                                    <option value={3600}>1 Hour</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.settingsFooter}>
                    <button className={styles.resetButton} onClick={onReset}>
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;

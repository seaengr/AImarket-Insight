import React, { useState, useEffect } from 'react';
import type { RiskSettings, MarketAnalysis } from '../../state/types';
import styles from './RiskCalculator.module.css';

interface RiskCalculatorProps {
    settings: RiskSettings;
    analysis: MarketAnalysis;
    onUpdateSettings: (settings: Partial<RiskSettings>) => void;
}

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({
    settings,
    analysis,
    onUpdateSettings
}) => {
    const [balance, setBalance] = useState(settings.accountBalance.toString());
    const [riskPercent, setRiskPercent] = useState(settings.riskPercent.toString());

    // Position sizing logic
    const entry = analysis.levels.entryZone.low;
    const sl = analysis.levels.stopLoss;
    const isGold = analysis.marketInfo.symbol.includes('XAU');

    const calculatePositionSize = () => {
        if (!entry || !sl || entry === sl) return 0;

        const balanceNum = parseFloat(balance) || 0;
        const riskPercentNum = parseFloat(riskPercent) || 1;

        const riskAmount = balanceNum * (riskPercentNum / 100);
        const slDistance = Math.abs(entry - sl);

        if (slDistance === 0) return 0;

        // For Gold (XAUUSD), 1 lot = 100 oz. SL distance is in points ($).
        // For Forex, 1 lot = 100,000 units. SL distance is in pips.

        if (isGold) {
            // Gold: Position Size (lots) = Risk Amount / (SL Distance * 100)
            return riskAmount / (slDistance * 100);
        } else {
            // Standard Forex: Position Size = Risk Amount / (SL Pips * Pip Value)
            // Simplified: Risk Amount / SL Distance
            return riskAmount / slDistance;
        }
    };

    const positionSize = calculatePositionSize();
    const riskValue = (parseFloat(balance) || 0) * (parseFloat(riskPercent) || 0) / 100;

    useEffect(() => {
        onUpdateSettings({
            accountBalance: parseFloat(balance) || 0,
            riskPercent: parseFloat(riskPercent) || 0
        });
    }, [balance, riskPercent]);

    return (
        <div className={styles.container}>
            <div className={styles.inputGroup}>
                <div className={styles.inputItem}>
                    <label className={styles.label}>Balance ($)</label>
                    <input
                        type="number"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputItem}>
                    <label className={styles.label}>Risk (%)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(e.target.value)}
                        className={styles.input}
                    />
                </div>
            </div>

            <div className={styles.resultBox}>
                <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Recommended Size</span>
                    <span className={styles.resultValue}>{positionSize.toFixed(2)} Lots</span>
                </div>
                <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Risk Amount</span>
                    <span className={styles.resultValue}>${riskValue.toFixed(2)}</span>
                </div>
            </div>

            <div className={styles.infoBox}>
                <div className={styles.infoLine}>
                    <span>Entry</span>
                    <span>{entry.toFixed(2)}</span>
                </div>
                <div className={styles.infoLine}>
                    <span>Stop Loss</span>
                    <span>{sl.toFixed(2)}</span>
                </div>
                <div className={styles.infoLine}>
                    <span>SL Distance</span>
                    <span>{Math.abs(entry - sl).toFixed(2)} points</span>
                </div>
            </div>
        </div>
    );
};

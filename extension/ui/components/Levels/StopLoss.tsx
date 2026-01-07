import React from 'react';
import { formatPrice } from '../../../shared/utils';
import styles from './Levels.module.css';

interface StopLossProps {
    value: number;
}

/**
 * StopLoss component
 * Displays stop loss price level
 */
export const StopLoss: React.FC<StopLossProps> = ({ value }) => {
    return (
        <div className={styles.stopLossCard}>
            <div className={styles.slValue}>{formatPrice(value)}</div>
        </div>
    );
};

export default StopLoss;

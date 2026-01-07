import React from 'react';
import { cn, formatPrice } from '../../../shared/utils';
import styles from './Levels.module.css';

interface TakeProfitProps {
    tp1: number;
    tp2: number;
    tp3?: number;
}

/**
 * TakeProfit component
 * Displays take profit target levels in a grid
 */
export const TakeProfit: React.FC<TakeProfitProps> = ({ tp1, tp2, tp3 }) => {
    const hasTP3 = tp3 !== undefined;

    return (
        <div className={cn(styles.takeProfitGrid, hasTP3 && styles.threeColumns)}>
            <div className={styles.tpCard}>
                <div className={styles.tpLabel}>TP1</div>
                <div className={styles.tpValue}>{formatPrice(tp1)}</div>
            </div>
            <div className={styles.tpCard}>
                <div className={styles.tpLabel}>TP2</div>
                <div className={styles.tpValue}>{formatPrice(tp2)}</div>
            </div>
            {hasTP3 && (
                <div className={styles.tpCard}>
                    <div className={styles.tpLabel}>TP3</div>
                    <div className={styles.tpValue}>{formatPrice(tp3)}</div>
                </div>
            )}
        </div>
    );
};

export default TakeProfit;

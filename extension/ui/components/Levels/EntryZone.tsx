import React from 'react';
import { formatPrice } from '../../../shared/utils';
import styles from './Levels.module.css';

interface EntryZoneProps {
    low: number;
    high: number;
}

/**
 * EntryZone component
 * Displays entry price range with visual indicator
 */
export const EntryZone: React.FC<EntryZoneProps> = ({ low, high }) => {
    return (
        <div className={styles.entryZone}>
            <span className={`${styles.entryValue} ${styles.low}`}>
                {formatPrice(low)}
            </span>
            <div className={styles.rangeBar}>
                <div className={styles.rangeIndicator} />
            </div>
            <span className={`${styles.entryValue} ${styles.high}`}>
                {formatPrice(high)}
            </span>
        </div>
    );
};

export default EntryZone;

import React from 'react';
import { cn } from '../../../shared/utils';
import styles from './Signal.module.css';

interface ConfidenceMeterProps {
    value: number; // 0-100
    size?: number;
}

/**
 * ConfidenceMeter component
 * Circular progress indicator showing confidence level
 */
export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
    value,
    size = 70,
}) => {
    // SVG circle calculations
    const radius = 27;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(value, 0), 100);
    const offset = circumference - (progress / 100) * circumference;

    // Determine color based on value
    const getColorClass = () => {
        if (progress >= 70) return styles.high;
        if (progress >= 40) return styles.medium;
        return styles.low;
    };

    return (
        <div className={styles.confidenceContainer}>
            <div className={styles.confidenceMeter} style={{ width: size, height: size }}>
                <svg className={styles.confidenceRing} viewBox="0 0 60 60">
                    {/* Background ring */}
                    <circle
                        className={styles.confidenceBackground}
                        cx="30"
                        cy="30"
                        r={radius}
                    />
                    {/* Progress ring */}
                    <circle
                        className={cn(styles.confidenceProgress, getColorClass())}
                        cx="30"
                        cy="30"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className={styles.confidenceValue}>
                    <span className={styles.confidenceNumber}>{Math.round(progress)}</span>
                    <span className={styles.confidenceLabel}>Confidence</span>
                </div>
            </div>
        </div>
    );
};

export default ConfidenceMeter;

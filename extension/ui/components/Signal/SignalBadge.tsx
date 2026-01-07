import React from 'react';
import { cn } from '../../../shared/utils';
import type { SignalType } from '../../state/types';
import styles from './Signal.module.css';

interface SignalBadgeProps {
    type: SignalType;
    animate?: boolean;
}

/**
 * SignalBadge component
 * Displays Buy/Sell/Hold signal with color coding
 */
export const SignalBadge: React.FC<SignalBadgeProps> = ({
    type,
    animate = false,
}) => {
    const signalClass = type.toLowerCase() as 'buy' | 'sell' | 'hold';

    return (
        <span
            className={cn(
                styles.signalBadge,
                styles[signalClass],
                animate && styles.animating
            )}
        >
            {type}
        </span>
    );
};

export default SignalBadge;

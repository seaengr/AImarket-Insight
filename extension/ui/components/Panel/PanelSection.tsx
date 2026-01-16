import React from 'react';
import { cn } from '../../../shared/utils';
import styles from './Panel.module.css';

interface PanelSectionProps {
    title: string;
    isActive?: boolean;
    showToggle?: boolean;
    onToggle?: () => void;
    children: React.ReactNode;
}

/**
 * PanelSection component
 * Reusable section wrapper with optional toggle switch
 */
export const PanelSection: React.FC<PanelSectionProps> = ({
    title,
    isActive = true,
    showToggle = false,
    onToggle,
    children,
}) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{title}</h3>
                {showToggle && (
                    <div
                        className={cn(styles.toggle, isActive && styles.active)}
                        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        role="switch"
                        aria-checked={isActive}
                        tabIndex={0}
                        onKeyDown={(e) => { e.stopPropagation(); e.key === 'Enter' && onToggle?.(); }}
                    >
                        <div className={styles.toggleKnob} />
                    </div>
                )}
            </div>
            {isActive && <div className={styles.sectionContent}>{children}</div>}
        </div>
    );
};

export default PanelSection;

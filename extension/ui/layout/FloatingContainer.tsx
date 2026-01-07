import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn, clamp } from '../../shared/utils';
import { PANEL_WIDTH, PANEL_MARGIN, Z_INDEX } from '../../shared/constants';
import './layout.css';

interface FloatingContainerProps {
    children: React.ReactNode;
    initialPosition: { top: number; left: number };
    isMinimized: boolean;
    onPositionChange: (top: number, left: number) => void;
}

/**
 * FloatingContainer component
 * Provides drag functionality for panel positioning
 */
export const FloatingContainer: React.FC<FloatingContainerProps> = ({
    children,
    initialPosition,
    isMinimized,
    onPositionChange,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(initialPosition);
    const dragStart = useRef({ x: 0, y: 0 });
    const positionStart = useRef({ top: 0, left: 0 });

    // Handle drag start
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        // Only allow dragging from header (check target)
        if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
            e.preventDefault();
            setIsDragging(true);
            dragStart.current = { x: e.clientX, y: e.clientY };
            positionStart.current = { ...position };
        }
    }, [position]);

    const handleTranslate = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;

        const newLeft = clamp(
            positionStart.current.left + deltaX,
            PANEL_MARGIN,
            window.innerWidth - (isMinimized ? 48 : PANEL_WIDTH) - PANEL_MARGIN
        );
        const newTop = clamp(
            positionStart.current.top + deltaY,
            PANEL_MARGIN,
            window.innerHeight - (isMinimized ? 48 : 500) // 500 as fallback height approx
        );

        setPosition({ top: newTop, left: newLeft });
    }, [isDragging, isMinimized]);

    // Handle dragging events
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseUp = () => {
            setIsDragging(false);
            onPositionChange(position.top, position.left);
        };

        document.addEventListener('mousemove', handleTranslate);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleTranslate);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleTranslate, onPositionChange, position]);

    // Update position when receiving new props
    useEffect(() => {
        setPosition(initialPosition);
    }, [initialPosition]);

    return (
        <div
            ref={containerRef}
            className={cn(
                'floating-container',
                isDragging && 'dragging',
                isMinimized && 'minimized'
            )}
            style={{
                top: position.top,
                left: position.left,
                zIndex: Z_INDEX.panel,
            }}
            onMouseDown={handleDragStart}
        >
            {children}
        </div>
    );
};

export default FloatingContainer;

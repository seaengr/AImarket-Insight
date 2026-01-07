import React from 'react';
import { App } from '../ui/App';

/**
 * TradingViewOverlay component
 * Wrapper component for rendering in TradingView context
 * Provides isolation and context for the AI panel
 */
export const TradingViewOverlay: React.FC = () => {
    return (
        <div id="ai-market-insight-overlay">
            <App />
        </div>
    );
};

export default TradingViewOverlay;

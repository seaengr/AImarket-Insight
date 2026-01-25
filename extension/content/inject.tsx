/**
 * Content Script Entry Point
 * Injects the AI Market Insight panel into TradingView pages
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { TradingViewOverlay } from './TradingViewOverlay';
import { EXTENSION_ID } from '../shared/constants';

// Ensure we only inject once
const INJECTION_ID = `${EXTENSION_ID}-root`;

/**
 * Check if we're on a supported chart page (TradingView or Exness)
 */
function isSupportedChart(): boolean {
    const url = window.location.href;
    const isTradingView = url.includes('tradingview.com') && (
        url.includes('/chart') ||
        url.includes('/symbols') ||
        document.querySelector('.chart-container') !== null
    );
    const isExness = url.includes('exness.com') && (
        url.includes('terminal') ||
        url.includes('webtrading') ||
        document.querySelector('[class*="terminal-"], [class*="chart-"], .v-terminal') !== null
    );
    return isTradingView || isExness;
}

/**
 * Wait for chart container to be available
 */
function waitForChartContainer(timeout: number = 10000): Promise<Element | null> {
    return new Promise((resolve) => {
        const startTime = Date.now();

        const check = () => {
            // Check for TradingView or Exness specific containers
            const container = document.querySelector('.chart-container, .chart-page, [class*="terminal-"], .v-terminal');
            if (container) {
                resolve(container);
                return;
            }

            if (Date.now() - startTime > timeout) {
                // Fallback to body if chart container not found
                resolve(document.body);
                return;
            }

            requestAnimationFrame(check);
        };

        check();
    });
}

/**
 * Inject the React app into the page
 */
async function injectApp(): Promise<void> {
    // Check if already injected
    if (document.getElementById(INJECTION_ID)) {
        console.log('[AI Market Insight] Already injected, skipping');
        return;
    }

    // Check if on supported chart page
    if (!isSupportedChart()) {
        console.log('[AI Market Insight] Not a supported chart page, skipping');
        return;
    }

    console.log('[AI Market Insight] Injecting panel...');

    // Wait for page to be ready
    await waitForChartContainer();

    // Create container element
    const container = document.createElement('div');
    container.id = INJECTION_ID;
    container.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
    z-index: 9998;
  `;

    // Append to body
    document.body.appendChild(container);

    // Create React root and render
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <TradingViewOverlay />
        </React.StrictMode>
    );

    console.log('[AI Market Insight] Panel injected successfully');
}

/**
 * Initialize injection
 */
function init(): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectApp);
    } else {
        injectApp();
    }
}

// Start injection
init();

// Handle SPA navigation (TradingView uses client-side routing)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Re-check if we need to inject
        setTimeout(injectApp, 1000);
    }
});

observer.observe(document.body, {
    subtree: true,
    childList: true,
});

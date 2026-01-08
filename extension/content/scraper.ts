/**
 * TradingView DOM Scraper
 * Utilities for extracting market data from the TradingView interface
 */

export interface ScrapedData {
    symbol: string;
    timeframe: string;
}

/**
 * Extract the current trading symbol and timeframe from the DOM
 */
export function scrapeTradingViewData(): ScrapedData | null {
    try {
        // --- 1. Find Symbol ---
        let symbolText = '';

        // Strategy A: Header toolbar button (The most direct way)
        const symbolButton = document.querySelector('#header-toolbar-symbol-search');
        if (symbolButton) {
            // Try to find the inner text of the button
            const innerText = Array.from(symbolButton.querySelectorAll('div'))
                .find(el => el.textContent?.length && el.textContent.length < 15)?.textContent?.trim();
            if (innerText) symbolText = innerText;
        }

        // Strategy B: Chart Legend (Very reliable if chart is loaded)
        if (!symbolText) {
            const legendSymbol = document.querySelector('.js-symbol-entry, [data-symbol-short]');
            symbolText = legendSymbol?.getAttribute('data-symbol-short') || legendSymbol?.textContent?.trim() || '';
        }

        // Strategy C: Page Title Fallback (SYMBOL — PRICE — TradingView)
        if (!symbolText || symbolText.length > 20) {
            const title = document.title;
            // Matches "BTCUSD —" or "AAPL 150.00"
            const match = title.match(/^([A-Z0-9.\-_/]+)\s*[—\- ]/i);
            if (match && match[1]) {
                symbolText = match[1].trim();
            }
        }

        // Clean symbol (remove exchange names like BINANCE:BTCUSD -> BTCUSD)
        if (symbolText.includes(':')) {
            symbolText = symbolText.split(':')[1];
        }

        // --- 2. Find Timeframe ---
        let intervalText = '';

        // Strategy A: Interval toolbar button
        const intervalButton = document.querySelector('#header-toolbar-intervals');
        if (intervalButton) {
            intervalText = intervalButton.textContent?.trim() || '';
        }

        // Strategy B: Legend timeframe
        if (!intervalText) {
            const legendInterval = document.querySelector('.js-legend-interval');
            intervalText = legendInterval?.textContent?.trim() || '';
        }

        // --- Fallbacks and Validation ---
        const finalSymbol = symbolText || 'BTCUSD';
        const finalTimeframe = intervalText || '1H';

        return {
            symbol: finalSymbol,
            timeframe: finalTimeframe
        };
    } catch (error) {
        console.error('[AI Market Insight] Scraping failed:', error);
        return null;
    }
}

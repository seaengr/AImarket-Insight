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
        // 1. Find Symbol
        // Selector for the symbol search button which contains the ticker name
        const symbolElement = document.querySelector('[id="header-toolbar-symbol-search"] .first-7An5_e96');
        const symbolText = symbolElement?.textContent?.trim() ||
            document.querySelector('.title-7An5_e96')?.textContent?.trim() ||
            'BTCUSD'; // Fallback

        // 2. Find Timeframe
        // Selector for the timeframe interval button
        const intervalElement = document.querySelector('[id="header-toolbar-intervals"] .content-7An5_e96');
        const intervalText = intervalElement?.textContent?.trim() || '1H'; // Fallback

        return {
            symbol: symbolText,
            timeframe: intervalText
        };
    } catch (error) {
        console.error('[AI Market Insight] Scraping failed:', error);
        return null;
    }
}

/**
 * TradingView DOM Scraper
 * Optimized utility for extracting market data from TradingView
 */

export interface ScrapedData {
    symbol: string;
    timeframe: string;
    price: number | null;
}

/**
 * Extract the current trading symbol, timeframe, and price from the DOM
 */
export function scrapeTradingViewData(): ScrapedData | null {
    try {
        const url = window.location.href;
        const isExness = url.includes('exness.com');

        // --- 1. Find Symbol ---
        let symbolText = '';

        if (isExness) {
            // Exness specific symbol detection (Terminal + WebTrading)
            const exnessSymbol = document.querySelector(
                '[class*="symbolName-"], [class*="symbolText-"], [class*="active-"] [class*="symbolText-"], .v-terminal-header-symbol, [data-testid*="active-symbol"]'
            );
            symbolText = exnessSymbol?.textContent?.trim() || '';
        }

        if (!symbolText) {
            const symbolButton = document.querySelector('#header-toolbar-symbol-search');
            if (symbolButton) {
                symbolText = symbolButton.textContent?.split('—')[0].trim() || '';
            }
        }

        if (!symbolText) {
            const legendSymbol = document.querySelector('.js-symbol-entry, [data-symbol-short]');
            symbolText = legendSymbol?.getAttribute('data-symbol-short') || legendSymbol?.textContent?.trim() || '';
        }

        // Clean symbol
        if (symbolText.includes(':')) symbolText = symbolText.split(':')[1];
        symbolText = symbolText.toUpperCase().trim();

        // --- 2. Find Timeframe ---
        let intervalText = '';
        const intervalButton = document.querySelector('#header-toolbar-intervals, [class*="interval-"], .v-terminal-header-interval, [class*="active-"] [class*="timeframe-"]');
        if (intervalButton) {
            intervalText = intervalButton.textContent?.trim() || '';
        }

        // --- 3. Find Price ---
        let priceValue: number | null = null;

        // Step A: Exness Specific Price check (Terminal + WebTrading)
        if (isExness) {
            const exnessPrice = document.querySelector(
                '[class*="currentPrice-"], [class*="lastPrice-"], [class*="bidValue-"], [class*="askValue-"], .v-terminal-price, [data-testid*="price"]'
            );
            if (exnessPrice) {
                const parsed = parseFloat(exnessPrice.textContent?.replace(/,/g, '') || '');
                if (!isNaN(parsed) && parsed > 0.1) priceValue = parsed;
            }
        }

        // Step B: Check Page Title
        if (priceValue === null) {
            const titleMatch = document.title.match(/([0-9,.]+)\s*[—\- ]/);
            if (titleMatch && titleMatch[1]) {
                const parsed = parseFloat(titleMatch[1].replace(/,/g, ''));
                if (!isNaN(parsed) && parsed > 0.1) priceValue = parsed;
            }
        }

        // Step C: Target active legend price
        if (priceValue === null) {
            const activeLegend = document.querySelector('[data-name="legend-series-item"], .chart-markup-table, [class*="legend-"]');
            if (activeLegend) {
                const priceElements = activeLegend.querySelectorAll('div[class*="value-"], span[class*="value-"], [class*="last-"], [class*="price-"]');
                for (const el of Array.from(priceElements)) {
                    const text = el.textContent?.trim() || '';
                    if (/^[0-9,.]+$/.test(text) && text.length > 2) {
                        const parsed = parseFloat(text.replace(/,/g, ''));
                        if (!isNaN(parsed) && parsed > 0.1) {
                            priceValue = parsed;
                            break;
                        }
                    }
                }
            }
        }

        // Step D: Fallback to the y-axis
        if (priceValue === null) {
            const axisPrice = document.querySelector('[class*="priceAxis-"] [class*="last-value-"], .v-terminal-axis-price');
            if (axisPrice) {
                priceValue = parseFloat(axisPrice.textContent?.replace(/,/g, '') || '');
            }
        }

        if (!symbolText) return null;

        return {
            symbol: symbolText,
            timeframe: intervalText || '1H',
            price: priceValue
        };
    } catch (error) {
        console.error('[AI Market Insight] Scraping failed:', error);
        return null;
    }
}

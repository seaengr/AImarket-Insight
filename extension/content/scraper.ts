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
        // --- 1. Find Symbol (Fast Strategy) ---
        let symbolText = '';
        const symbolButton = document.querySelector('#header-toolbar-symbol-search');
        if (symbolButton) {
            symbolText = symbolButton.textContent?.split('—')[0].trim() || '';
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
        const intervalButton = document.querySelector('#header-toolbar-intervals');
        if (intervalButton) {
            intervalText = intervalButton.textContent?.trim() || '';
        }

        // --- 3. Find Price (SMART & FAST STRATEGY) ---
        let priceValue: number | null = null;

        // Step A: Check Page Title (Very fast, no DOM traversal)
        const titleMatch = document.title.match(/([0-9,.]+)\s*[—\- ]/);
        if (titleMatch && titleMatch[1]) {
            const parsed = parseFloat(titleMatch[1].replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0.1) priceValue = parsed;
        }

        // Step B: Target active legend price (Specific selectors only)
        if (priceValue === null) {
            // Find the legend item for the active series
            const activeLegend = document.querySelector('[data-name="legend-series-item"], .chart-markup-table');
            if (activeLegend) {
                // Focus ONLY on elements likely to contain the price
                const priceElements = activeLegend.querySelectorAll('div[class*="value-"], span[class*="value-"], [class*="last-"]');
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

        // Step C: Fallback to the y-axis (Last price label)
        if (priceValue === null) {
            const axisPrice = document.querySelector('[class*="priceAxis-"] [class*="last-value-"]');
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

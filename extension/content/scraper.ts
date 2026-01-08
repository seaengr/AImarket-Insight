/**
 * TradingView DOM Scraper
 * Utilities for extracting market data from the TradingView interface
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
        // --- 1. Find Symbol ---
        let symbolText = '';

        // Strategy A: Header toolbar button
        const symbolButton = document.querySelector('#header-toolbar-symbol-search');
        if (symbolButton) {
            const innerText = Array.from(symbolButton.querySelectorAll('div'))
                .find(el => el.textContent?.length && el.textContent.length < 15)?.textContent?.trim();
            if (innerText) symbolText = innerText;
        }

        // Strategy B: Chart Legend
        if (!symbolText) {
            const legendSymbol = document.querySelector('.js-symbol-entry, [data-symbol-short]');
            symbolText = legendSymbol?.getAttribute('data-symbol-short') || legendSymbol?.textContent?.trim() || '';
        }

        // Strategy C: Page Title Fallback
        if (!symbolText || symbolText.length > 20) {
            const title = document.title;
            const match = title.match(/^([A-Z0-9.\-_/]+)\s*[—\- ]/i);
            if (match && match[1]) {
                symbolText = match[1].trim();
            }
        }

        if (symbolText.includes(':')) {
            symbolText = symbolText.split(':')[1];
        }

        // --- 2. Find Timeframe ---
        let intervalText = '';
        const intervalButton = document.querySelector('#header-toolbar-intervals');
        if (intervalButton) {
            intervalText = intervalButton.textContent?.trim() || '';
        }

        // --- 3. Find Price (ROBUST STRATEGY) ---
        let priceValue: number | null = null;

        // Strategy A: Legend Price (The most accurate for the active chart)
        // TradingView legend price usually has a class containing "last-value" and is near the symbol
        const legendWrapper = document.querySelector('[data-name="legend-series-item"], .chart-markup-table');
        if (legendWrapper) {
            // Look for elements with "last" or "value" in class names
            const priceCandleEls = legendWrapper.querySelectorAll('div[class*="value-"], span[class*="value-"]');
            for (const el of Array.from(priceCandleEls)) {
                const text = el.textContent?.trim() || '';
                // Matches prices like 4446.59 or 12,345.67
                if (/^[0-9,.]+$/.test(text) && text.length > 1) {
                    const parsed = parseFloat(text.replace(/,/g, ''));
                    if (!isNaN(parsed) && parsed > 0) {
                        priceValue = parsed;
                        // The first numeric value in the legend is usually the Last Price
                        break;
                    }
                }
            }
        }

        // Strategy B: Page Title (Format: SYMBOL PRICE — TradingView)
        if (priceValue === null) {
            const titleMatch = document.title.match(/([0-9,.]+)\s*[—\- ]/);
            if (titleMatch && titleMatch[1]) {
                const cleanPrice = titleMatch[1].replace(/,/g, '');
                const parsed = parseFloat(cleanPrice);
                if (!isNaN(parsed) && parsed > 1) priceValue = parsed;
            }
        }

        // Strategy C: Global Search for price-like elements with high specificity
        if (priceValue === null) {
            const lastPriceEl = document.querySelector('.js-symbol-last, [class*="symbol-last"], .price-3_p_TDAc');
            if (lastPriceEl) {
                const text = lastPriceEl.textContent?.trim() || '';
                const parsed = parseFloat(text.replace(/,/g, ''));
                if (!isNaN(parsed)) priceValue = parsed;
            }
        }

        const finalSymbol = symbolText.toUpperCase();
        const finalTimeframe = intervalText || '1H';

        if (!finalSymbol) return null;

        // Debug logging to help identify why price might be missing
        if (priceValue === null) {
            console.warn(`[AI Market Insight] Symbol detected (${finalSymbol}) but PRICE IS MISSING. Verify DOM selectors.`);
        } else {
            console.log(`[AI Market Insight] SUCCESS: ${finalSymbol} @ ${priceValue}`);
        }

        return {
            symbol: finalSymbol,
            timeframe: finalTimeframe,
            price: priceValue
        };
    } catch (error) {
        console.error('[AI Market Insight] Scraping failed:', error);
        return null;
    }
}

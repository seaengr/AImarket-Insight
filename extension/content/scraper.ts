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

        // --- 3. Find Price (ULTRA-AGGRESSIVE STRATEGY) ---
        let priceValue: number | null = null;

        // Strategy 1: Smart Title Regex (Handles 'XAUUSD 4446.59' or 'XAUUSD — 4446.59')
        const titleText = document.title;
        const titlePriceMatch = titleText.match(/([0-9]{2,}[,.]?[0-9]*)/); // Find first long number
        if (titlePriceMatch && titlePriceMatch[1]) {
            const cleaned = titlePriceMatch[1].replace(/,/g, '');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed) && parsed > 1) {
                // Verify it's not the change percentage
                if (!titleText.includes(`(${titlePriceMatch[1]}%)`)) {
                    priceValue = parsed;
                }
            }
        }

        // Strategy 2: Label Search (Look for the word "Price" as seen in user's screenshot)
        if (priceValue === null) {
            const allElements = document.querySelectorAll('div, span, [class*="legend"]');
            for (const el of Array.from(allElements)) {
                const text = el.textContent?.trim().toLowerCase();
                if (text === 'price' || text === 'last' || text === 'last price') {
                    // The value is usually in a sibling or parent's child
                    const parent = el.parentElement;
                    if (parent) {
                        const children = Array.from(parent.children);
                        const index = children.indexOf(el);
                        // Scan subsequent siblings for a number
                        for (let i = index + 1; i < Math.min(index + 4, children.length); i++) {
                            const childText = children[i].textContent?.trim() || '';
                            const cleaned = childText.replace(/,/g, '');
                            const parsed = parseFloat(cleaned);
                            if (!isNaN(parsed) && parsed > 0.1) {
                                priceValue = parsed;
                                break;
                            }
                        }
                    }
                }
                if (priceValue !== null) break;
            }
        }

        // Strategy 3: Chart Legend Classes (Common TV selectors)
        if (priceValue === null) {
            const legendSelectors = [
                '[class*="last-value-"]',
                '[class*="lastPrice-"]',
                '[data-name="legend-last-value"]',
                '.js-symbol-last'
            ];

            for (const selector of legendSelectors) {
                const els = document.querySelectorAll(selector);
                for (const el of Array.from(els)) {
                    const text = el.textContent?.trim() || '';
                    const parsed = parseFloat(text.replace(/,/g, ''));
                    if (!isNaN(parsed) && parsed > 0.1) {
                        priceValue = parsed;
                        break;
                    }
                }
                if (priceValue !== null) break;
            }
        }

        const finalSymbol = symbolText.toUpperCase();
        const finalTimeframe = intervalText || '1H';

        if (!finalSymbol) return null;

        if (priceValue === null) {
            console.warn(`[AI Market Insight] Symbol: ${finalSymbol} | PRICE NOT FOUND. Using fallback.`);
        } else {
            console.log(`[AI Market Insight] Symbol: ${finalSymbol} | Price captured: ${priceValue}`);
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

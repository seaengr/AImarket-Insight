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

        // --- 3. Find Price (ULTRA-ROBUST STRATEGY) ---
        let priceValue: number | null = null;

        // Step 1: Check Page Title (Usually the most stable if enabled by user)
        // Regex looks for a number with decimals following the symbol at the start
        const titleMatch = document.title.match(/[A-Z0-9.\-_/]+\s+([0-9,.]+)/i);
        if (titleMatch && titleMatch[1]) {
            const cleaned = titleMatch[1].replace(/,/g, '');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed) && parsed > 0.00001) {
                priceValue = parsed;
            }
        }

        // Step 2: Check standard "Last Value" legend items (High priority)
        if (priceValue === null) {
            // Find all elements that TV typically uses for the "Last Price" in the legend or scale
            const priceSelectors = [
                '[class*="last-value-"]',
                '[class*="lastPrice-"]',
                '.js-symbol-last',
                '[data-name="legend-last-value"]',
                '.price-3_p_TDAc'
            ];

            for (const selector of priceSelectors) {
                const els = document.querySelectorAll(selector);
                for (const el of Array.from(els)) {
                    const text = el.textContent?.trim() || '';
                    const cleaned = text.replace(/,/g, '');
                    const parsed = parseFloat(cleaned);
                    if (!isNaN(parsed) && parsed > 0.00001 && text.length < 15) {
                        priceValue = parsed;
                        break;
                    }
                }
                if (priceValue !== null) break;
            }
        }

        // Step 3: Scan the whole chart legend area for ANY numeric value (Fallback)
        if (priceValue === null) {
            const legendArea = document.querySelector('[data-name="legend-series-item"], .chart-markup-table, .legend-30_TpxX9');
            if (legendArea) {
                // Get all divs/spans that might contain values
                const items = legendArea.querySelectorAll('div, span');
                for (const item of Array.from(items)) {
                    const text = item.textContent?.trim() || '';
                    // Strictly match numeric looking strings to avoid volume or percentage
                    if (/^[0-9,.]+$/.test(text) && text.includes('.') && text.length > 2) {
                        const parsed = parseFloat(text.replace(/,/g, ''));
                        if (!isNaN(parsed) && parsed > 0.1) {
                            priceValue = parsed;
                            break;
                        }
                    }
                }
            }
        }

        // Step 4: Check Scale labels (The price axis on the right)
        if (priceValue === null) {
            const scaleLabels = document.querySelectorAll('[class*="priceAxis-"], [class*="axisLabel-"]');
            for (const label of Array.from(scaleLabels)) {
                const text = label.textContent?.trim() || '';
                const cleaned = text.replace(/,/g, '');
                const parsed = parseFloat(cleaned);
                if (!isNaN(parsed) && parsed > 0.1 && text.length < 15) {
                    priceValue = parsed;
                    break;
                }
            }
        }

        const finalSymbol = symbolText.toUpperCase();
        const finalTimeframe = intervalText || '1H';

        if (!finalSymbol) return null;

        if (priceValue === null) {
            console.warn(`[AI Market Insight] Failed to detect price for ${finalSymbol}. Using backend fallback.`);
        } else {
            console.log(`[AI Market Insight] Symbol: ${finalSymbol} | Final Price Found: ${priceValue}`);
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

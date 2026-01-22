import Parser from 'rss-parser';
import { logger } from '../../shared/logger';

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    content: string;
    sentiment?: {
        score: number;
        label: string;
    };
}

export class NewsService {
    private parser: Parser;
    // Common financial RSS feeds
    private feeds = [
        'https://www.forexfactory.com/news/rss',
        'https://www.dailyfx.com/feeds/market-alerts',
        'http://feeds.reuters.com/reuters/businessNews'
    ];

    constructor() {
        this.parser = new Parser();
    }

    /**
     * Fetches latest news headlines related to a symbol or asset class
     */
    async getHeadlines(symbol: string): Promise<string[]> {
        logger.info(`Fetching news headlines for ${symbol}...`);

        try {
            // In a real app, we might fetch multiple feeds and filter
            // For MVP, we'll fetch ForexFactory and look for keywords
            const feed = await this.parser.parseURL(this.feeds[0]);

            // Extract keywords from symbol (e.g., XAUUSD -> [Gold, USD])
            const keywords = this.getKeywords(symbol);

            const headlines = feed.items
                .filter(item => {
                    const content = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase();
                    return keywords.some(k => content.includes(k.toLowerCase()));
                })
                .map(item => item.title || '')
                .slice(0, 5); // Keep top 5 latest relevant headlines

            if (headlines.length === 0) {
                // Fallback to top general market news if no specific symbol news found
                return feed.items.slice(0, 3).map(item => item.title || '');
            }

            return headlines;
        } catch (error: any) {
            logger.error(`Failed to fetch news: ${error.message}`);
            return [];
        }
    }

    private getKeywords(symbol: string): string[] {
        const keywords = [symbol];

        if (symbol.includes('USD')) keywords.push('Dollar', 'Fed', 'United States');
        if (symbol.includes('XAU')) keywords.push('Gold', 'Bullion');
        if (symbol.includes('BTC') || symbol.includes('ETH')) keywords.push('Crypto', 'Bitcoin', 'Ethereum');
        if (symbol.includes('JPY')) keywords.push('Yen', 'BoJ');
        if (symbol.includes('EUR')) keywords.push('Euro', 'ECB');
        if (symbol.includes('GBP')) keywords.push('Pound', 'BoE');

        return keywords;
    }
}

export const newsService = new NewsService();

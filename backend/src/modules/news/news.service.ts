import Parser from 'rss-parser';
import { logger } from '../../shared/logger';
import { aiService } from '../ai/ai.service';
import { AnalysisResponse } from '../../types/api.types';

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    content: string;
    sentiment?: number; // -1 to 1
}

export class NewsService {
    private parser: Parser;
    private feeds = [
        'https://www.forexfactory.com/news/rss',
        'https://www.fxstreet.com/rss/news',
    ];

    constructor() {
        this.parser = new Parser();
    }

    /**
     * Fetches recent headlines from configured RSS feeds
     */
    async getRecentHeadlines(symbol: string): Promise<NewsItem[]> {
        try {
            logger.info(`Fetching RSS news for ${symbol}`);
            const allItems: NewsItem[] = [];

            for (const url of this.feeds) {
                const feed = await this.parser.parseURL(url);
                const filtered = feed.items
                    .filter(item => {
                        const content = (item.title + ' ' + (item.contentSnippet || '')).toUpperCase();
                        return content.includes(symbol.toUpperCase()) ||
                            content.includes('GOLD') ||
                            content.includes('MARKET');
                    })
                    .slice(0, 5)
                    .map(item => ({
                        title: item.title || '',
                        link: item.link || '',
                        pubDate: item.pubDate || '',
                        content: item.contentSnippet || '',
                    }));

                allItems.push(...filtered);
            }

            return allItems.slice(0, 5);
        } catch (error: any) {
            logger.error(`News fetch failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Analyzes sentiment of headlines using the local AI
     */
    async analyzeSentiment(headlines: NewsItem[]): Promise<{ score: number; sentiment: string }> {
        if (headlines.length === 0) return { score: 0, sentiment: 'Neutral' };

        const textToAnalyze = headlines.map(h => h.title).join('\n');

        // This is a simplified integration. 
        // We will eventually update AIService to handle raw sentiment prompts.
        logger.info('Analyzing news sentiment via AI...');

        // Mock sentiment for now until AI prompt is updated
        // In the next step, I will update PromptBuilder to handle this.
        let score = 0;
        const textLower = textToAnalyze.toLowerCase();

        if (textLower.includes('bullish') || textLower.includes('soar') || textLower.includes('gain')) score += 0.5;
        if (textLower.includes('bearish') || textLower.includes('plummet') || textLower.includes('loss')) score -= 0.5;

        return {
            score: Math.max(-1, Math.min(1, score)),
            sentiment: score > 0 ? 'Positive' : (score < 0 ? 'Negative' : 'Neutral')
        };
    }
}

export const newsService = new NewsService();

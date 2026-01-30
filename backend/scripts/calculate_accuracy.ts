
import fs from 'fs';
import path from 'path';

const journalPath = path.join(process.cwd(), 'data', 'journal.json');

try {
    const data = fs.readFileSync(journalPath, 'utf-8');
    const logs = JSON.parse(data);

    const completedTrades = logs.filter((l: any) => l.outcome === 'WIN' || l.outcome === 'LOSS');
    const wins = completedTrades.filter((l: any) => l.outcome === 'WIN').length;
    const losses = completedTrades.filter((l: any) => l.outcome === 'LOSS').length;
    const total = completedTrades.length;

    const winRate = total > 0 ? (wins / total) * 100 : 0;

    console.log('--------------------------------');
    console.log('📊 TRAIDING ACCURACY REPORT');
    console.log('--------------------------------');
    console.log(`Total Trades: ${total}`);
    console.log(`Wins:         ${wins}`);
    console.log(`Losses:       ${losses}`);
    console.log(`Accuracy:     ${winRate.toFixed(2)}%`);
    console.log('--------------------------------');

} catch (error) {
    console.error('Error reading journal:', error);
}

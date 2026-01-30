
const fs = require('fs');
const path = require('path');

const journalPath = path.join(process.cwd(), 'data', 'journal.json');
const targetSymbol = process.argv[2] || 'XAUUSD';

try {
    if (!fs.existsSync(journalPath)) {
        console.log('No journal data found.');
        process.exit(0);
    }

    const data = fs.readFileSync(journalPath, 'utf-8');
    const logs = JSON.parse(data);

    // Filter for the specific symbol and completed trades
    const symbolTrades = logs.filter(l => l.symbol === targetSymbol);
    const completedTrades = symbolTrades.filter(l => l.outcome === 'WIN' || l.outcome === 'LOSS');

    const wins = completedTrades.filter(l => l.outcome === 'WIN').length;
    const losses = completedTrades.filter(l => l.outcome === 'LOSS').length;
    const total = completedTrades.length;

    const winRate = total > 0 ? (wins / total) * 100 : 0;

    console.log('--------------------------------');
    console.log(`📊 ACCURACY REPORT: ${targetSymbol}`);
    console.log('--------------------------------');
    console.log(`Total Trades: ${total}`);
    console.log(`Wins:         ${wins}`);
    console.log(`Losses:       ${losses}`);
    console.log(`Win Rate:     ${winRate.toFixed(2)}%`);
    console.log('--------------------------------');

} catch (error) {
    console.error('Error reading journal:', error);
}

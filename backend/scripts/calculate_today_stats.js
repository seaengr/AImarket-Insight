const fs = require('fs');
const path = require('path');

const journalPath = path.join(__dirname, '../data/journal.json');

try {
    const data = fs.readFileSync(journalPath, 'utf8');
    const journal = JSON.parse(data);

    // Get Start of Day (Local Time +08:00)
    // Current UTC: 2026-01-30 T 07:03 (approx)
    // Local: 15:03.
    // Start of Day Local: 2026-01-30 00:00:00

    const now = new Date();
    // Reset to 00:00:00 local
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Filter Today's Trades
    const todayTrades = journal.filter(t => t.timestamp >= startOfDay);

    const wins = todayTrades.filter(t => t.outcome === 'WIN').length;
    const losses = todayTrades.filter(t => t.outcome === 'LOSS').length;
    const pending = todayTrades.filter(t => t.outcome === 'PENDING').length;

    console.log(`Total Trades Today: ${todayTrades.length}`);
    console.log(`Wins: ${wins}`);
    console.log(`Losses: ${losses}`);
    console.log(`Pending: ${pending}`);
    console.log('--- Details ---');
    todayTrades.forEach(t => {
        const date = new Date(t.timestamp).toLocaleTimeString();
        console.log(`[${date}] ${t.symbol} ${t.type} @ ${t.price} -> ${t.outcome}`);
    });

} catch (err) {
    console.error('Error:', err);
}

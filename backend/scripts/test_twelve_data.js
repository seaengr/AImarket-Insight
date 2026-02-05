const axios = require('axios');

const apiKey = 'a09dd7121cb340cd88137cf9d4454888';
const symbol = 'XAUUSDT.P';

async function test() {
    console.log(`Testing Twelve Data API for ${symbol}...`);
    try {
        const quoteUrl = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
        const quoteRes = await axios.get(quoteUrl);
        console.log('Quote Response:', JSON.stringify(quoteRes.data, null, 2));

        const emaUrl = `https://api.twelvedata.com/ema?symbol=${symbol}&interval=1h&time_period=21&apikey=${apiKey}`;
        const emaRes = await axios.get(emaUrl);
        console.log('EMA Response status:', emaRes.data.status);
        if (emaRes.data.values) {
            console.log('Latest EMA:', emaRes.data.values[0]);
        } else {
            console.log('EMA data missing:', emaRes.data);
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

test();

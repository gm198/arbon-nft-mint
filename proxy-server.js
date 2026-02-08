// CORS Proxy Server for ArbOn NFT API
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Enable CORS for all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy for /api/challenge
app.post('/api/challenge', async (req, res) => {
    try {
        console.log('Proxying challenge request:', req.body);
        
        const response = await axios.post('https://www.arbonnft.xyz/api/challenge', req.body, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Challenge proxy error:', error.message);
        res.status(500).json({ 
            error: 'Proxy error', 
            message: error.message,
            success: false 
        });
    }
});

// Proxy for /api/mint
app.post('/api/mint', async (req, res) => {
    try {
        console.log('Proxying mint request:', { 
            walletAddress: req.body.walletAddress,
            challengeId: req.body.challengeId 
        });
        
        const response = await axios.post('https://www.arbonnft.xyz/api/mint', req.body, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Mint proxy error:', error.message);
        res.status(500).json({ 
            error: 'Proxy error', 
            message: error.message,
            success: false 
        });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`CORS Proxy Server running on http://0.0.0.0:${PORT}`);
    console.log('Endpoints:');
    console.log(`  GET  /health`);
    console.log(`  POST /api/challenge`);
    console.log(`  POST /api/mint`);
});
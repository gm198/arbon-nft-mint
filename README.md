# ArbOn NFT Mint Web Interface

A user-friendly web interface for minting ArbOn NFTs directly from your browser.

## 🚀 Features

- **Wallet Integration**: Connect MetaMask or any Web3 wallet
- **Challenge System**: Solve math challenges from ArbOn API
- **Mint Execution**: Direct blockchain transaction execution
- **Real-time Status**: Live updates on wallet, network, and transaction status
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Web3**: ethers.js v5
- **Wallet**: MetaMask/Web3 Provider
- **API**: ArbOn NFT API (`https://www.arbonnft.xyz/api`)
- **Network**: Arbitrum Mainnet

## 📋 Prerequisites

1. **Web3 Wallet**: MetaMask or compatible wallet
2. **Arbitrum Network**: Wallet must be connected to Arbitrum
3. **ETH Balance**: At least 0.0005 ETH for public mint (gas fees additional)

## 🎯 Usage

### 1. Connect Wallet
- Click "Connect Wallet" button
- Approve connection in MetaMask
- Ensure you're on Arbitrum network

### 2. Get Challenge
- Click "Get Challenge" button
- Solve the math problem displayed

### 3. Submit Answer
- Enter your solution in the answer field
- Click "Submit Answer"
- Wait for mint data from API

### 4. Mint NFT
- Review mint type and price
- Click "Mint NFT"
- Confirm transaction in MetaMask
- Wait for confirmation

## 🔧 Development

### Local Setup
```bash
# Clone the repository
git clone https://github.com/gm198/arbon-nft-mint.git

# Navigate to project
cd arbon-nft-mint

# Open in browser
open index.html
```

### File Structure
```
arbon-web-frontend/
├── index.html          # Main HTML file
├── app.js             # Main JavaScript logic
├── README.md          # Documentation
└── .gitignore         # Git ignore file
```

### API Integration
The interface communicates with:
- `POST /api/challenge` - Get math challenge
- `POST /api/mint` - Submit answer and get mint data

## 🌐 Deployment

### GitHub Pages
1. Create repository on GitHub
2. Push code to `main` branch
3. Enable GitHub Pages in repository settings
4. Access at `https://gm198.github.io/arbon-nft-mint/`

### Custom Domain
Update the base URL in `app.js`:
```javascript
const CONFIG = {
    apiBase: 'https://www.arbonnft.xyz/api',
    // ... other config
};
```

## 📊 Configuration

### Network Settings
- **Chain ID**: 42161 (Arbitrum Mainnet)
- **RPC URL**: `https://arb1.arbitrum.io/rpc`
- **NFT Contract**: `0x2079606049B99adB4cF70844496A026e53e47C60`

### Mint Types
- **Free**: Whitelisted users (gas fees only)
- **Public**: 0.0005 ETH mint price + gas fees

## 🔒 Security Notes

- **No Private Keys**: Interface never accesses private keys
- **Client-side Only**: All operations happen in browser
- **MetaMask Security**: Transactions require MetaMask approval
- **API Trust**: Relies on official ArbOn NFT API

## 🐛 Troubleshooting

### Common Issues

1. **Wallet Not Connecting**
   - Ensure MetaMask is installed
   - Check if pop-ups are blocked
   - Try refreshing the page

2. **Wrong Network**
   - Switch to Arbitrum in MetaMask
   - Interface will prompt to switch

3. **Transaction Fails**
   - Check ETH balance
   - Ensure sufficient gas
   - Verify network congestion

4. **API Errors**
   - Check API status at `https://www.arbonnft.xyz`
   - Verify wallet address format

## 📞 Support

- **GitHub Issues**: [Report bugs or feature requests](https://github.com/gm198/arbon-nft-mint/issues)
- **ArbOn Community**: [Official Discord/Twitter](https://www.arbonnft.xyz)
- **Blockchain**: [Arbiscan Contract](https://arbiscan.io/address/0x2079606049B99adB4cF70844496A026e53e47C60)

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- ArbOn NFT team for the API and contract
- ethers.js team for Web3 library
- Tailwind CSS for styling framework
- OpenClaw community for inspiration
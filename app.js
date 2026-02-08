// ArbOn NFT Mint Web Interface
// Main JavaScript File

console.log('ArbOn NFT Mint Interface loaded');

// Configuration
const CONFIG = {
    apiBase: 'https://www.arbonnft.xyz/api',
    nftContract: '0x2079606049B99adB4cF70844496A026e53e47C60',
    arbitrumChainId: '0xa4b1', // 42161 in hex
    arbitrumRpc: 'https://arb1.arbitrum.io/rpc'
};

// State
let state = {
    walletConnected: false,
    walletAddress: null,
    networkConnected: false,
    balance: '0',
    challengeData: null,
    mintData: null,
    provider: null,
    signer: null
};

// DOM Elements
const elements = {
    // Status
    statusIndicator: document.getElementById('status-indicator'),
    networkInfo: document.getElementById('network-info'),
    walletInfo: document.getElementById('wallet-info'),
    balanceInfo: document.getElementById('balance-info'),
    
    // Buttons
    connectWalletBtn: document.getElementById('connect-wallet'),
    getChallengeBtn: document.getElementById('get-challenge'),
    submitAnswerBtn: document.getElementById('submit-answer'),
    mintNftBtn: document.getElementById('mint-nft'),
    clearLogBtn: document.getElementById('clear-log'),
    
    // Inputs
    answerInput: document.getElementById('answer-input'),
    
    // Containers
    challengeContainer: document.getElementById('challenge-container'),
    noChallengeMessage: document.getElementById('no-challenge-message'),
    mintInfo: document.getElementById('mint-info'),
    mintMessage: document.getElementById('mint-message'),
    resultsContainer: document.getElementById('results-container'),
    
    // Text elements
    challengeText: document.getElementById('challenge-text'),
    challengeId: document.getElementById('challenge-id'),
    mintType: document.getElementById('mint-type'),
    mintPrice: document.getElementById('mint-price'),
    mintDescription: document.getElementById('mint-description'),
    
    // Log
    logConsole: document.getElementById('log-console')
};

// Initialize
function init() {
    logMessage('System', 'ArbOn NFT Mint interface initialized');
    
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
        logMessage('Error', 'MetaMask not detected. Please install MetaMask to use this interface.');
        elements.connectWalletBtn.disabled = true;
        elements.connectWalletBtn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>MetaMask Required';
        return;
    }
    
    // Event Listeners
    elements.connectWalletBtn.addEventListener('click', connectWallet);
    elements.getChallengeBtn.addEventListener('click', getChallenge);
    elements.submitAnswerBtn.addEventListener('click', submitAnswer);
    elements.mintNftBtn.addEventListener('click', mintNFT);
    elements.clearLogBtn.addEventListener('click', clearLog);
    
    // Auto-connect if previously connected
    checkAutoConnect();
}

// Logging
function logMessage(source, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    
    let colorClass = 'text-gray-300';
    if (source === 'System') colorClass = 'text-blue-400';
    if (source === 'Success') colorClass = 'text-green-400';
    if (source === 'Error') colorClass = 'text-red-400';
    if (source === 'Wallet') colorClass = 'text-purple-400';
    if (source === 'API') colorClass = 'text-cyan-400';
    if (source === 'Transaction') colorClass = 'text-orange-400';
    
    logEntry.className = colorClass;
    logEntry.innerHTML = `[${timestamp}] [${source}] ${message}`;
    
    elements.logConsole.appendChild(logEntry);
    elements.logConsole.scrollTop = elements.logConsole.scrollHeight;
    
    console.log(`[${source}] ${message}`);
}

function clearLog() {
    elements.logConsole.innerHTML = '<div class="text-gray-500">[System] Log cleared</div>';
}

// Wallet Connection
async function connectWallet() {
    try {
        logMessage('Wallet', 'Connecting wallet...');
        
        // Double-check MetaMask
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask not detected. Please install MetaMask first.');
        }
        
        // Request account access with better error handling
        let accounts;
        try {
            accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
        } catch (requestError) {
            // User rejected the request
            if (requestError.code === 4001) {
                logMessage('Error', 'Connection rejected by user. Please approve the connection in MetaMask.');
                return;
            }
            throw requestError;
        }
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please unlock MetaMask.');
        }
        
        state.walletAddress = accounts[0];
        state.walletConnected = true;
        
        // Create provider and signer
        state.provider = new ethers.providers.Web3Provider(window.ethereum);
        state.signer = state.provider.getSigner();
        
        // Check network
        await checkNetwork();
        
        // Update UI
        updateWalletStatus();
        updateButtonStates();
        
        logMessage('Success', `Wallet connected: ${state.walletAddress.substring(0, 10)}...`);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                logMessage('Wallet', 'Wallet disconnected');
                resetState();
            } else {
                state.walletAddress = accounts[0];
                updateWalletStatus();
                logMessage('Wallet', `Account changed: ${state.walletAddress.substring(0, 10)}...`);
            }
        });
        
        // Listen for network changes
        window.ethereum.on('chainChanged', () => {
            logMessage('Wallet', 'Network changed');
            checkNetwork();
        });
        
        // Listen for disconnect
        window.ethereum.on('disconnect', () => {
            logMessage('Wallet', 'Wallet disconnected');
            resetState();
        });
        
    } catch (error) {
        logMessage('Error', `Wallet connection failed: ${error.message}`);
        
        // Show user-friendly error message
        let userMessage = error.message;
        if (error.message.includes('MetaMask not detected')) {
            userMessage = 'MetaMask not found. Please install MetaMask extension.';
            showMetaMaskGuide();
        } else if (error.message.includes('User rejected')) {
            userMessage = 'Connection rejected. Please approve the connection in MetaMask popup.';
        } else if (error.message.includes('No accounts')) {
            userMessage = 'No accounts found. Please unlock MetaMask.';
        }
        
        // Update button to show error
        elements.connectWalletBtn.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${userMessage.substring(0, 30)}...`;
        elements.connectWalletBtn.className = 'w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl';
        
        // Reset button after 3 seconds
        setTimeout(() => {
            elements.connectWalletBtn.innerHTML = '<i class="fas fa-plug mr-2"></i>Connect Wallet';
            elements.connectWalletBtn.className = 'w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02]';
        }, 3000);
    }
}

async function checkAutoConnect() {
    if (window.ethereum && window.ethereum.selectedAddress) {
        logMessage('System', 'Auto-connecting to previously connected wallet...');
        await connectWallet();
    }
}

async function checkNetwork() {
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId === CONFIG.arbitrumChainId) {
            state.networkConnected = true;
            elements.networkInfo.textContent = 'Arbitrum Mainnet';
            elements.networkInfo.className = 'text-green-300';
            
            // Get balance
            await updateBalance();
            
            logMessage('System', 'Connected to Arbitrum network');
        } else {
            state.networkConnected = false;
            elements.networkInfo.textContent = 'Wrong Network (Switch to Arbitrum)';
            elements.networkInfo.className = 'text-red-300';
            
            logMessage('Error', 'Please switch to Arbitrum network');
            
            // Offer to switch
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: CONFIG.arbitrumChainId }]
                });
                logMessage('System', 'Switched to Arbitrum network');
                await checkNetwork();
            } catch (switchError) {
                logMessage('Error', 'Failed to switch network');
            }
        }
        
        updateStatusIndicator();
        
    } catch (error) {
        logMessage('Error', `Network check failed: ${error.message}`);
    }
}

async function updateBalance() {
    try {
        if (!state.provider || !state.walletAddress) return;
        
        const balance = await state.provider.getBalance(state.walletAddress);
        const ethBalance = ethers.utils.formatEther(balance);
        state.balance = ethBalance;
        
        elements.balanceInfo.textContent = `${parseFloat(ethBalance).toFixed(6)} ETH`;
        elements.balanceInfo.className = 'text-green-300';
        
    } catch (error) {
        logMessage('Error', `Failed to get balance: ${error.message}`);
    }
}

function updateWalletStatus() {
    if (state.walletConnected && state.walletAddress) {
        elements.walletInfo.textContent = `${state.walletAddress.substring(0, 10)}...`;
        elements.walletInfo.className = 'text-green-300';
    } else {
        elements.walletInfo.textContent = 'Not connected';
        elements.walletInfo.className = 'text-gray-300';
    }
}

function updateStatusIndicator() {
    const indicator = elements.statusIndicator.querySelector('.w-3');
    const text = elements.statusIndicator.querySelector('span');
    
    if (state.walletConnected && state.networkConnected) {
        indicator.className = 'w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse';
        text.textContent = 'Connected';
        text.className = 'text-sm text-green-300';
    } else if (state.walletConnected && !state.networkConnected) {
        indicator.className = 'w-3 h-3 rounded-full bg-yellow-500 mr-2';
        text.textContent = 'Wrong Network';
        text.className = 'text-sm text-yellow-300';
    } else {
        indicator.className = 'w-3 h-3 rounded-full bg-red-500 mr-2';
        text.textContent = 'Disconnected';
        text.className = 'text-sm text-red-300';
    }
}

function updateButtonStates() {
    // Get Challenge button
    elements.getChallengeBtn.disabled = !(state.walletConnected && state.networkConnected);
    
    // Mint button (will be enabled after getting mint data)
    elements.mintNftBtn.disabled = !state.mintData;
}

// API Functions
async function getChallenge() {
    try {
        if (!state.walletAddress) {
            logMessage('Error', 'Wallet not connected');
            return;
        }
        
        logMessage('API', 'Requesting challenge...');
        elements.getChallengeBtn.disabled = true;
        elements.getChallengeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Requesting...';
        
        const response = await fetch(`${CONFIG.apiBase}/challenge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: state.walletAddress
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            state.challengeData = data;
            
            // Update UI
            elements.challengeText.textContent = data.challenge;
            elements.challengeId.textContent = data.challengeId.substring(0, 16) + '...';
            elements.challengeContainer.classList.remove('hidden');
            elements.noChallengeMessage.classList.add('hidden');
            
            // Enable answer input
            elements.answerInput.disabled = false;
            elements.answerInput.focus();
            
            logMessage('Success', `Challenge received: ${data.challenge}`);
            logMessage('API', `Challenge ID: ${data.challengeId}`);
            
        } else {
            throw new Error('Invalid challenge response');
        }
        
    } catch (error) {
        logMessage('Error', `Failed to get challenge: ${error.message}`);
    } finally {
        elements.getChallengeBtn.disabled = false;
        elements.getChallengeBtn.innerHTML = '<i class="fas fa-question-circle mr-2"></i>Get Challenge';
    }
}

async function submitAnswer() {
    try {
        if (!state.challengeData) {
            logMessage('Error', 'No challenge to solve');
            return;
        }
        
        const answer = elements.answerInput.value.trim();
        if (!answer) {
            logMessage('Error', 'Please enter an answer');
            return;
        }
        
        logMessage('API', 'Submitting answer...');
        elements.submitAnswerBtn.disabled = true;
        elements.submitAnswerBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
        
        const response = await fetch(`${CONFIG.apiBase}/mint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: state.walletAddress,
                challengeId: state.challengeData.challengeId,
                answer: answer
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.hex && data.ca) {
            state.mintData = data;
            
            // Update UI
            elements.mintInfo.classList.remove('hidden');
            elements.mintMessage.classList.add('hidden');
            
            elements.mintType.textContent = data.mintType || 'public';
            elements.mintPrice.textContent = `${data.value || '0.0005'} ETH`;
            
            if (data.mintType === 'free') {
                elements.mintDescription.textContent = 'You are whitelisted! Free mint available (gas fees only).';
            } else {
                elements.mintDescription.textContent = 'Public mint requires payment.';
            }
            
            // Enable mint button
            elements.mintNftBtn.disabled = false;
            
            logMessage('Success', 'Mint data received successfully');
            logMessage('API', `Mint type: ${data.mintType || 'public'}, Price: ${data.value || '0.0005'} ETH`);
            
            // Show success message
            showResult('success', 'Challenge solved! Ready to mint NFT.');
            
        } else {
            throw new Error('Invalid mint response');
        }
        
    } catch (error) {
        logMessage('Error', `Failed to submit answer: ${error.message}`);
        showResult('error', `Failed to submit answer: ${error.message}`);
    } finally {
        elements.submitAnswerBtn.disabled = false;
        elements.submitAnswerBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Submit Answer';
    }
}

// Mint Function
async function mintNFT() {
    try {
        if (!state.mintData || !state.signer) {
            logMessage('Error', 'Mint data or wallet not available');
            return;
        }
        
        logMessage('Transaction', 'Preparing mint transaction...');
        elements.mintNftBtn.disabled = true;
        elements.mintNftBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Preparing...';
        
        // Prepare transaction
        const tx = {
            to: state.mintData.ca,
            data: state.mintData.hex,
            value: ethers.utils.parseEther(state.mintData.value || '0')
        };
        
        logMessage('Transaction', 'Sending transaction...');
        elements.mintNftBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
        
        // Send transaction
        const transaction = await state.signer.sendTransaction(tx);
        
        logMessage('Success', `Transaction sent! Hash: ${transaction.hash}`);
        showResult('pending', `Transaction sent. Waiting for confirmation...<br>Hash: ${transaction.hash}`);
        
        elements.mintNftBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Confirming...';
        
        // Wait for confirmation
        const receipt = await transaction.wait();
        
        if (receipt.status === 1) {
            logMessage('Success', `Transaction confirmed! Block: ${receipt.blockNumber}`);
            showResult('success', `🎉 NFT Minted Successfully!<br>
                Transaction: ${transaction.hash.substring(0, 20)}...<br>
                Block: ${receipt.blockNumber}<br>
                Gas Used: ${receipt.gasUsed.toString()}`);
            
            // Reset for next mint
            resetMintState();
            
        } else {
            throw new Error('Transaction failed');
        }
        
    } catch (error) {
        logMessage('Error', `Mint failed: ${error.message}`);
        showResult('error', `Mint failed: ${error.message}`);
    } finally {
        elements.mintNftBtn.disabled = false;
        elements.mintNftBtn.innerHTML = '<i class="fas fa-gem mr-2"></i>Mint NFT';
    }
}

// UI Helpers
function showResult(type, message) {
    const resultDiv = document.createElement('div');
    resultDiv.className = `p-4 rounded-xl border ${
        type === 'success' ? 'bg-green-900/30 border-green-500 text-green-300' :
        type === 'error' ? 'bg-red-900/30 border-red-500 text-red-300' :
        type === 'pending' ? 'bg-blue-900/30 border-blue-500 text-blue-300' :
        'bg-gray-800 border-gray-700 text-gray-300'
    }`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'pending' ? 'fa-clock' : 'fa-info-circle';
    
    resultDiv.innerHTML = `
        <div class="flex items-start">
            <i class="fas ${icon} mt-1 mr-3"></i>
            <div>${message}</div>
        </div>
    `;
    
    // Clear previous results and add new one
    elements.resultsContainer.innerHTML = '';
    elements.resultsContainer.appendChild(resultDiv);
}

function resetMintState() {
    state.challengeData = null;
    state.mintData = null;
    
    // Reset UI
    elements.challengeContainer.classList.add('hidden');
    elements.noChallengeMessage.classList.remove('hidden');
    elements.mintInfo.classList.add('hidden');
    elements.mintMessage.classList.remove('hidden');
    elements.answerInput.value = '';
    elements.answerInput.disabled = true;
    
    elements.mintNftBtn.disabled = true;
}

function resetState() {
    state = {
        walletConnected: false,
        walletAddress: null,
        networkConnected: false,
        balance: '0',
        challengeData: null,
        mintData: null,
        provider: null,
        signer: null
    };
    
    updateWalletStatus();
    updateStatusIndicator();
    updateButtonStates();
    resetMintState();
    
    elements.networkInfo.textContent = 'Not connected';
    elements.networkInfo.className = 'text-gray-300';
    elements.balanceInfo.textContent = '0 ETH';
    elements.balanceInfo.className = 'text-gray-300';
}

// Browser compatibility check
function checkBrowserCompatibility() {
    const issues = [];
    
    // Check for common blockers
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        issues.push('Site should be served over HTTPS for MetaMask to work properly');
    }
    
    // Check if in iframe (some sites block MetaMask in iframes)
    if (window.self !== window.top) {
        issues.push('MetaMask may not work properly in iframes. Try opening in a new tab.');
    }
    
    // Check browser
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('firefox')) {
        issues.push('Firefox users: Ensure MetaMask extension is enabled and not blocked by privacy settings.');
    } else if (userAgent.includes('safari')) {
        issues.push('Safari users: MetaMask may require additional permissions. Check Safari extensions.');
    } else if (userAgent.includes('edge')) {
        issues.push('Edge users: Ensure MetaMask extension is installed from Microsoft Edge Add-ons.');
    }
    
    if (issues.length > 0) {
        logMessage('Warning', 'Potential compatibility issues detected:');
        issues.forEach(issue => {
            logMessage('Warning', `• ${issue}`);
        });
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    // Check browser compatibility first
    checkBrowserCompatibility();
    
    // Then initialize the app
    init();
});
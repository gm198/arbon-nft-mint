// ArbOn NFT Mint Web Interface
// Main JavaScript File

console.log('ArbOn NFT Mint Interface loaded');

// Configuration
const CONFIG = {
    // Use proxy server to avoid CORS issues
    apiBase: 'http://137.131.43.70:3000',  // Public proxy server
    
    // Direct API (has CORS issues)
    directApiBase: 'https://www.arbonnft.xyz/api',
    
    nftContract: '0x2079606049B99adB4cF70844496A026e53e47C60',
    arbitrumChainId: '0xa4b1', // 42161 in hex
    arbitrumRpc: 'https://arb1.arbitrum.io/rpc',
    
    // Use proxy by default (CORS workaround)
    useProxy: true
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
    
    // Check if ethers.js is loaded
    if (typeof ethers === 'undefined') {
        logMessage('Error', 'ethers.js not loaded yet. Waiting...');
        
        // Disable buttons until ethers is ready
        elements.connectWalletBtn.disabled = true;
        elements.connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading ethers.js...';
        
        // Wait for ethers to load
        const checkEthers = setInterval(() => {
            if (typeof ethers !== 'undefined') {
                clearInterval(checkEthers);
                logMessage('Success', 'ethers.js loaded successfully');
                continueInit();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (typeof ethers === 'undefined') {
                clearInterval(checkEthers);
                logMessage('Error', 'ethers.js failed to load after 10 seconds');
                elements.connectWalletBtn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>ethers.js Failed to Load';
                elements.connectWalletBtn.onclick = () => location.reload();
            }
        }, 10000);
        
        return;
    }
    
    continueInit();
}

function continueInit() {
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
    
    // Update button state
    elements.connectWalletBtn.disabled = false;
    elements.connectWalletBtn.innerHTML = '<i class="fas fa-plug mr-2"></i>Connect Wallet';
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

// API Functions with CORS handling
async function getChallenge() {
    try {
        if (!state.walletAddress) {
            logMessage('Error', 'Wallet not connected');
            return;
        }
        
        logMessage('API', 'Requesting challenge...');
        elements.getChallengeBtn.disabled = true;
        elements.getChallengeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Requesting...';
        
        const requestData = {
            walletAddress: state.walletAddress
        };
        
        let response;
        let data;
        
        // Try proxy first if configured
        if (CONFIG.useProxy) {
            try {
                response = await fetchWithTimeout(`${CONFIG.apiBase}/api/challenge`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                }, 10000);
                
                if (!response.ok) {
                    throw new Error(`Proxy error: ${response.status}`);
                }
                
                data = await response.json();
                logMessage('API', 'Challenge received via proxy');
                
            } catch (proxyError) {
                logMessage('Warning', `Proxy failed: ${proxyError.message}, trying direct API...`);
                
                // Fallback to direct API
                try {
                    response = await fetchWithTimeout(`${CONFIG.directApiBase}/challenge`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    }, 10000);
                    
                    if (!response.ok) {
                        throw new Error(`Direct API error: ${response.status}`);
                    }
                    
                    data = await response.json();
                    logMessage('API', 'Challenge received via direct API (CORS may work)');
                    
                } catch (directError) {
                    // If direct API also fails, show CORS error
                    if (directError.message.includes('Failed to fetch') || directError.message.includes('NetworkError')) {
                        throw new Error('CORS error: API server blocks browser requests. Need proxy server.');
                    }
                    throw directError;
                }
            }
        } else {
            // Try direct API only
            response = await fetchWithTimeout(`${CONFIG.directApiBase}/challenge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            }, 10000);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            data = await response.json();
        }
        
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
        
        // Show CORS-specific help
        if (error.message.includes('CORS error')) {
            showCORSWarning();
        }
    } finally {
        elements.getChallengeBtn.disabled = false;
        elements.getChallengeBtn.innerHTML = '<i class="fas fa-question-circle mr-2"></i>Get Challenge';
    }
}

// Helper function for fetch with timeout
function fetchWithTimeout(url, options, timeout = 10000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

// Show CORS warning
function showCORSWarning() {
    const warningHtml = `
        <div class="mt-4 p-4 bg-red-900/30 border border-red-500 rounded-xl">
            <h4 class="font-bold text-red-300 mb-2">
                <i class="fas fa-ban mr-2"></i>CORS Error Detected
            </h4>
            <p class="text-red-200 mb-3">
                The ArbOn API server blocks direct browser requests due to CORS policy.
            </p>
            <div class="space-y-2">
                <p class="text-sm text-red-300">
                    <strong>Solution:</strong> Run a proxy server or use the test server.
                </p>
                <div class="flex space-x-2">
                    <button onclick="useTestServer()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl">
                        <i class="fas fa-server mr-2"></i>Use Test Server
                    </button>
                    <button onclick="showProxyInstructions()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl">
                        <i class="fas fa-code mr-2"></i>Setup Proxy
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Insert after challenge container
    elements.challengeContainer.insertAdjacentHTML('afterend', warningHtml);
}

// Global functions for CORS solutions
window.useTestServer = function() {
    logMessage('System', 'Switching to test server...');
    window.location.href = 'http://137.131.43.70:8080/';
};

window.showProxyInstructions = function() {
    const instructions = `
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
                <h3 class="text-2xl font-bold text-green-300 mb-4">
                    <i class="fas fa-server mr-2"></i>Proxy Server Setup
                </h3>
                <div class="space-y-4">
                    <div>
                        <h4 class="font-bold text-blue-300 mb-2">1. Install dependencies:</h4>
                        <pre class="bg-gray-900 p-3 rounded text-sm overflow-x-auto">npm install express cors axios</pre>
                    </div>
                    <div>
                        <h4 class="font-bold text-blue-300 mb-2">2. Run proxy server:</h4>
                        <pre class="bg-gray-900 p-3 rounded text-sm overflow-x-auto">node proxy-server.js</pre>
                    </div>
                    <div>
                        <h4 class="font-bold text-blue-300 mb-2">3. Update frontend config:</h4>
                        <pre class="bg-gray-900 p-3 rounded text-sm overflow-x-auto">const CONFIG = {
    apiBase: 'http://localhost:3000',
    // ... other config
};</pre>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', instructions);
};

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
    
    // Check for known problematic extensions
    const problematicExtensions = [
        'Immersive Translate',  // From your error logs
        'AdBlock',
        'uBlock Origin',
        'Privacy Badger',
        'NoScript'
    ];
    
    // Check if page is being modified (indicating extension interference)
    if (document.documentElement.innerHTML.length > 1000000) {
        issues.push('Large page size detected - may indicate extension interference');
    }
    
    if (issues.length > 0) {
        logMessage('Warning', 'Potential compatibility issues detected:');
        issues.forEach(issue => {
            logMessage('Warning', `• ${issue}`);
        });
        
        // Show extension warning if relevant
        if (issues.some(issue => issue.includes('extension'))) {
            showExtensionWarning();
        }
    }
}

// Show extension interference warning
function showExtensionWarning() {
    const warningHtml = `
        <div class="mt-4 p-4 bg-red-900/30 border border-red-500 rounded-xl">
            <h4 class="font-bold text-red-300 mb-2">
                <i class="fas fa-exclamation-triangle mr-2"></i>Browser Extension Interference Detected
            </h4>
            <p class="text-red-200 mb-3">
                Some browser extensions may be interfering with ethers.js or MetaMask.
            </p>
            <div class="space-y-2">
                <button onclick="tryDisableExtensions()" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl">
                    <i class="fas fa-power-off mr-2"></i>Try Disabling Extensions Temporarily
                </button>
                <button onclick="tryIncognito()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl">
                    <i class="fas fa-user-secret mr-2"></i>Try Incognito/Private Mode
                </button>
            </div>
        </div>
    `;
    
    // Insert after status indicator
    elements.statusIndicator.insertAdjacentHTML('afterend', warningHtml);
}

// Extension troubleshooting functions
function tryDisableExtensions() {
    logMessage('System', 'Trying to work around extension issues...');
    
    // Try to reload ethers.js with cache busting
    const newScript = document.createElement('script');
    newScript.src = `https://cdn.ethers.io/lib/ethers-5.7.umd.min.js?t=${Date.now()}`;
    newScript.onload = () => {
        logMessage('Success', 'ethers.js reloaded with cache busting');
        if (typeof ethers !== 'undefined') {
            location.reload();
        }
    };
    document.head.appendChild(newScript);
}

function tryIncognito() {
    // Create a data URL that can be opened in incognito
    const htmlContent = document.documentElement.outerHTML;
    const dataUrl = `data:text/html;base64,${btoa(htmlContent)}`;
    
    window.open(dataUrl, '_blank');
    logMessage('System', 'Opened page in new window (try incognito mode)');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    // Check browser compatibility first
    checkBrowserCompatibility();
    
    // Then initialize the app
    init();
});
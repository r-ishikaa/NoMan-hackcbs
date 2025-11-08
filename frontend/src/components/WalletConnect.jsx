import React, { useState, useEffect } from 'react';
import { Wallet, Check, AlertCircle, ExternalLink } from 'lucide-react';

const WalletConnect = ({ onWalletConnected, currentWallet }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(currentWallet || null);

  // Check if wallets are installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum?.isMetaMask;
  const isPhantomInstalled = typeof window !== 'undefined' && window.solana?.isPhantom;

  useEffect(() => {
    if (currentWallet) {
      setConnectedWallet(currentWallet);
    }
  }, [currentWallet]);

  // Connect to MetaMask (Ethereum)
  const connectMetaMask = async () => {
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        const walletData = {
          type: 'metamask',
          address: address,
          network: 'ethereum',
          shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        };

        setConnectedWallet(walletData);
        if (onWalletConnected) {
          onWalletConnected(walletData);
        }
      }
    } catch (err) {
      console.error('MetaMask connection error:', err);
      setError(err.message || 'Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect to Phantom (Solana)
  const connectPhantom = async () => {
    if (!isPhantomInstalled) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request connection
      const response = await window.solana.connect();
      const address = response.publicKey.toString();

      const walletData = {
        type: 'phantom',
        address: address,
        network: 'solana',
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      };

      setConnectedWallet(walletData);
      if (onWalletConnected) {
        onWalletConnected(walletData);
      }
    } catch (err) {
      console.error('Phantom connection error:', err);
      setError(err.message || 'Failed to connect to Phantom');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    if (connectedWallet?.type === 'phantom' && window.solana) {
      await window.solana.disconnect();
    }
    setConnectedWallet(null);
    if (onWalletConnected) {
      onWalletConnected(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {connectedWallet ? (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">
                {connectedWallet.type === 'metamask' ? 'MetaMask' : 'Phantom'} Connected
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Disconnect
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Wallet className="w-4 h-4" />
            <span className="font-mono">{connectedWallet.shortAddress}</span>
            <span className="text-xs text-gray-500">({connectedWallet.network})</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MetaMask Card */}
          <button
            onClick={connectMetaMask}
            disabled={isConnecting}
            className="group relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <svg className="w-10 h-10" viewBox="0 0 318.6 318.6">
                  <path fill="#E2761B" d="M274.1 35.5l-99.5 73.9L193 65.8z"/>
                  <path fill="#E4761B" d="M44.4 35.5l98.7 74.6-17.5-44.3zm193.9 171.3l-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z"/>
                  <path fill="#E4761B" d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5zm111.3 0l-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5l33.9 16.5-4.7-39.3z"/>
                  <path fill="#D7C1B3" d="M211.8 247.4l-33.9-16.5 2.7 22.1-.3 9.3zm-105 0l31.5 14.9-.2-9.3 2.5-22.1z"/>
                  <path fill="#233447" d="M138.8 193.5l-28.2-8.3 19.9-9.1zm40.9 0l8.3-17.4 20 9.1z"/>
                  <path fill="#CD6116" d="M106.8 247.4l4.8-40.6-31.3.9zm71.1-40.6l4.8 40.6 26.5-39.7zM230.8 162.1l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"/>
                  <path fill="#E4751F" d="M87.8 162.1l23.6 46-.8-22.9zm120.3 23.1l-1 22.9 23.7-46zm-64-20.6l-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0l-2.7 18 1.2 45 6.7-34.1z"/>
                  <path fill="#F6851B" d="M179.8 193.5l-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"/>
                  <path fill="#C0AD9E" d="M180.3 262.3l.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"/>
                  <path fill="#161616" d="M177.9 230.9l-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"/>
                  <path fill="#763D16" d="M278.3 114.2l8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"/>
                  <path fill="#F6851B" d="M267.2 153.5l-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3l-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4l3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"/>
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">MetaMask</h3>
                <p className="text-xs text-gray-500">
                  {isMetaMaskInstalled ? 'Connect Ethereum wallet' : 'Install MetaMask'}
                </p>
              </div>
              {!isMetaMaskInstalled && (
                <ExternalLink className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>

          {/* Phantom Card */}
          <button
            onClick={connectPhantom}
            disabled={isConnecting}
            className="group relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg className="w-10 h-10" viewBox="0 0 128 128" fill="none">
                  <path d="M105.5 22.5C94.5 11.5 79.5 5.5 64 5.5C48.5 5.5 33.5 11.5 22.5 22.5C11.5 33.5 5.5 48.5 5.5 64C5.5 79.5 11.5 94.5 22.5 105.5C33.5 116.5 48.5 122.5 64 122.5C79.5 122.5 94.5 116.5 105.5 105.5C116.5 94.5 122.5 79.5 122.5 64C122.5 48.5 116.5 33.5 105.5 22.5Z" fill="#AB9FF2"/>
                  <path d="M88.5 45.5L75.5 58.5L88.5 71.5L101.5 58.5L88.5 45.5Z" fill="white"/>
                  <path d="M64 32.5L51 45.5L64 58.5L77 45.5L64 32.5Z" fill="white"/>
                  <path d="M39.5 45.5L26.5 58.5L39.5 71.5L52.5 58.5L39.5 45.5Z" fill="white"/>
                  <path d="M64 69.5L51 82.5L64 95.5L77 82.5L64 69.5Z" fill="white"/>
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">Phantom</h3>
                <p className="text-xs text-gray-500">
                  {isPhantomInstalled ? 'Connect Solana wallet' : 'Install Phantom'}
                </p>
              </div>
              {!isPhantomInstalled && (
                <ExternalLink className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>
        </div>
      )}

      {isConnecting && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Connecting to wallet...</p>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;


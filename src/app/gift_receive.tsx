// apps/chat-demo/src/app/gift_receive.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { useWeb3Helper } from './web3/web3_abstraction_helper';

import { getAccountBalance } from './web3/xion_rpc';
import toast from 'react-hot-toast';

interface TransactionStatus {
  status: 'pending' | 'success' | 'error';
  message?: string;
  progress?: number;
}

interface Balance {
  denom: string;
  amount: string;
}

export default function GiftReceivePage() {
  const { data: { bech32Address } } = useAbstraxionAccount();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);
  // const router = useRouter();
  const [, setBalanceMap] = useState<{ usdc: string; xion: string }>({ usdc: '0', xion: '0' });

  const [userId, setUserId] = useState<string>('');

  const { executeContractWithFeedback } = useWeb3Helper();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [token, setToken] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'pending',
    message: 'Initializing...',
    progress: 0,
  });


  const fetchData = useCallback(async () => {
    if (!bech32Address) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch balances
      const balancesResponse = await getAccountBalance(bech32Address);
      console.log('Received balances:', balancesResponse);
      setBalances(balancesResponse.balances);

      // Convert balances array to usdc/xion format
      const newBalanceMap = { usdc: '0', xion: '0' };
      balancesResponse.balances.forEach((balance: Balance) => {
        if (balance.denom.toLowerCase().includes('usdc') || balance.denom.toUpperCase().includes('IBC/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162')) {
          newBalanceMap.usdc = balance.amount;
        } else if (balance.denom.toLowerCase().includes('xion') || balance.denom.toLowerCase().includes('uxion')) {
          newBalanceMap.xion = balance.amount;
        }
      });
      setBalanceMap(newBalanceMap);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [bech32Address]);  

  useEffect(() => {
    if (bech32Address) {
      fetchData();
    }
  }, [bech32Address, fetchData]);


  useEffect(() => {
    const fetchUserName = async () => {
      if (!bech32Address) return;
      try {
        const response = await fetch(`/api/user/account/${bech32Address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user name');
        }
        const data = await response.json();
        setUserId(data.user_name);
      } catch (err) {
        console.error('Error fetching user name:', err);
      }
    };
    fetchUserName();
  }, [bech32Address]);



  const handleGiftClaim = async () => {
    if (!recipientEmail || !token || !bech32Address) return;

    // Show a loading toast when transaction starts
    const loadingToast = toast.loading('Processing gift claim...');

    try {
      // Prepare the contract message
      const contractAddress = 'xion1qf8q8uk764kwad86tc5lphscsmgezkl58d4t24q6g69jpwm27wqsmrcpt8';
      const executeMsg = {
        claim_gift: {
          gift_id: token,
        },
      };

      // Execute the contract with feedback
      const result = await executeContractWithFeedback(contractAddress, executeMsg);

      console.log('Gift claim result:', result);

      // Get a transaction ID
      const transactionId = result.transactionHash;
      
      // Store transaction data
      const storeResponse = await fetch(`/api/payment/store/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          source: bech32Address,
          destination: bech32Address,
          currency: 'TBD',
          value: 0,
          taxes: 0, 
          status: 'completed',
          transaction_type: 'deposit'
        }),
      });

      if (!storeResponse.ok) {
        console.error('Failed to store transaction:', await storeResponse.text());
        toast.error('Gift receive completed but failed to record in database');
      }

      // On success, dismiss the loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Gift claimed successfully!');

      setTransactionStatus({
        status: 'success',
        message: 'Gift claimed successfully! Hash: ' + result.transactionHash,
        progress: 100,
      });

      // Refresh balances after claiming the gift
      await fetchData();
      setRecipientEmail('');
      setToken('');
    } catch (error: unknown) {
      // On error, dismiss loading toast and show error
      toast.dismiss(loadingToast);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Gift claim failed: ${errorMessage}`);

      setTransactionStatus({
        status: 'error',
        message: `Gift claim failed: ${errorMessage}`,
        progress: 0,
      });
    }
  };

  const getFormattedBalance = (denom: string) => {
    // Format the balance for display - can be enhanced with proper decimal formatting
    const balance = balances.find(b => {
      if (denom === 'usdc') {
        return b.denom.toLowerCase().includes('usdc') || 
               b.denom.toUpperCase().includes('IBC/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162');
      }
      return b.denom.toLowerCase().includes(denom.toLowerCase());
    });
    
    if (!balance) return '0';
    
    // For better display, you might want to convert from micro units (if applicable)
    // Example: if balance is in micro units (uxion), divide by 1,000,000
    const amount = parseFloat(balance.amount);
    // console.log('Denom:', denom, 'Balance:', balance.denom, 'Amount:', amount);
    
    if (denom === 'xion' && balance.denom === 'uxion') {
      return (amount / 1000000).toFixed(6);
    } else if (denom === 'usdc' && (balance.denom === 'uusdc' || balance.denom.toUpperCase().includes('IBC/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162'))) {
      return (amount / 1000000).toFixed(6);
    }
    
    return balance.amount;
  };

  if (loading && !balances.length) {
    return (
      <div className="flex flex-col h-screen bg-blue-900 text-white p-4 items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-blue-900 text-white p-4">
      <div className="flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Claim Gift</h1>

        {/* Current Balances */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {balances.map((balance) => {
            // Determine the currency type from the denom
            const currencyType = balance.denom.toLowerCase().includes('usdc') || balance.denom.toUpperCase().includes('IBC/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162') ? 'usdc' : 
                                balance.denom.toLowerCase().includes('xion') ? 'xion' : 
                                balance.denom;
            
            // Get the display name for the balance (clean up the denom)
            const displayName = currencyType.toUpperCase();
            
            return (
              <div key={balance.denom} className="bg-blue-800 p-4 rounded-lg">
                <h2 className="text-gray-300 mb-2">{displayName} Balance</h2>
                <p className="text-2xl font-bold">{getFormattedBalance(currencyType)}</p>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Recipient Email Input */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Your Email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-2 rounded-lg bg-blue-800 border border-blue-700 text-white"
          />
        </div>

        {/* Token ID Input */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Token ID</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter the token ID you received"
            className="w-full p-2 rounded-lg bg-blue-800 border border-blue-700 text-white"
          />
        </div>

        {/* Claim Gift Button */}
        <button
          onClick={handleGiftClaim}
          disabled={!recipientEmail || !token}
          className="w-full p-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Claim Gift
        </button>

        {/* Transaction Status */}
        {transactionStatus.status !== 'pending' || transactionStatus.progress! > 0 ? (
          <div
            className={`mt-4 p-3 rounded-lg ${
              transactionStatus.status === 'success'
                ? 'bg-green-600 text-white'
                : transactionStatus.status === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-800 text-white'
            }`}
          >
            {transactionStatus.message}
          </div>
        ) : null}

        {/* Progress Bar */}
        {transactionStatus.progress! > 0 && (
          <div className="mt-4">
            <div className="w-full bg-blue-800 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full"
                style={{ width: `${transactionStatus.progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {transactionStatus.progress}% Complete
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
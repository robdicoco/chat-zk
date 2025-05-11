// apps/chat-demo/src/app/transfer.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { getAccountBalance } from './web3/xion_rpc';
import { useWeb3Helper } from './web3/web3_abstraction_helper';
import toast from 'react-hot-toast';

interface TransactionStatus {
  status: 'pending' | 'success' | 'error';
  message?: string;
  progress?: number;
}

interface Contact {
  id: string;
  user_name: string;
  email: string;
  account_id: string;
  created_at: string;
}

interface Balance {
  denom: string;
  amount: string;
}

export default function TransferPage() {
  const { data: { bech32Address } } = useAbstraxionAccount();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [, setBalanceMap] = useState<{ usdc: string; xion: string }>({ usdc: '0', xion: '0' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);

  // const router = useRouter();
  const { executeTransferWithFeedback } = useWeb3Helper();

  const searchParams = useSearchParams();
  const contactId = searchParams.get('contactId');

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'usdc' | 'xion'>('xion');
  const [amount, setAmount] = useState('');
  const [userId, setUserId] = useState<string>('');
  
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'pending',
    message: 'Initializing...',
    progress: 0
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

      // Fetching contacts
      const response = await fetch(`/api/contact/list?account_id=${bech32Address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      const data = await response.json();
      console.log('Received contacts:', data);
      setContacts(data);

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
    if (contacts.length > 0 && contactId) {
      const contact = contacts.find(c => c.account_id === contactId);
      setSelectedContact(contact || null);
    }
  }, [contacts, contactId]);

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

 

  const handleTransfer = async () => {
    if (!selectedContact || !amount || !bech32Address || !userId) return;
  
    // Show a loading toast when transaction starts
    const loadingToast = toast.loading('Processing transfer...');
  
    try {
      // Helper function to convert display amount to base units
      function convertToBaseUnit(amount: string) {
        // Both XION and USDC typically use 6 decimal places
        // 1 XION = 1,000,000 uxion
        // 1 USDC = 1,000,000 uusdc

        const displayAmount = parseFloat(amount);
        const baseUnit = BigInt(Math.round(displayAmount * 1_000_000));
        return baseUnit.toString();
      }
  
      console.log('Converting amount:', amount, 'to base unit:', convertToBaseUnit(amount));

      // Get the original denom from the balances
      const balance = balances.find(b => {
        if (selectedCurrency === 'usdc') {
          return b.denom.toLowerCase().includes('usdc') || 
                 b.denom.toUpperCase().includes('IBC/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162');
        }
        return b.denom.toLowerCase().includes(selectedCurrency.toLowerCase());
      });

      if (!balance) {
        throw new Error(`No balance found for ${selectedCurrency}`);
      }

      // console.log('Balance:', balance);
      // console.log('Balance denom:', balance.denom);

      // Your transfer logic here using the web3 helper
      const result = await executeTransferWithFeedback({
        recipient: selectedContact.account_id,
        amount: convertToBaseUnit(amount),
        denom: balance.denom,
      });

      console.log('Transfer result:', result);
  
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
          destination: selectedContact.account_id,
          currency: selectedCurrency.toUpperCase(),
          value: parseFloat(amount),
          taxes: 0, 
          status: 'completed',
          transaction_type: 'transfer'
        }),
      });
  
      if (!storeResponse.ok) {
        console.error('Failed to store transaction:', await storeResponse.text());
        toast.error('Transfer completed but failed to record in database');
    }
  
      // On success, dismiss the loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Transfer completed successfully!');
      
      // Rest of your success handling
      setTransactionStatus({
        status: 'success',
        message: 'Transfer completed successfully! Hash: ' + transactionId,
        progress: 100
      });
      
      await fetchData();
      setAmount('');
      
    } catch (error: unknown) {
      // On error, dismiss loading toast and show error
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Transfer failed: ${errorMessage}`);
      
      setTransactionStatus({
        status: 'error',
        message: `Transfer failed: ${errorMessage}`,
        progress: 0
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

  if (loading && !contacts.length) {
    return (
      <div className="flex flex-col h-screen bg-blue-900 text-white p-4 items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-blue-900 text-white p-4">
      <div className="flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Send Payment</h1>

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
        
        {/* Contact Selection */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Select Contact</label>
          <select
            value={selectedContact?.account_id || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const contact = contacts.find(c => c.account_id === selectedId);
              setSelectedContact(contact || null);
            }}
            className="w-full p-2 rounded-lg bg-blue-800 border border-blue-700 text-white"
          >
            <option value="">Select a contact</option>
            {contacts.map(contact => (
              <option key={contact.account_id} value={contact.account_id}>
                {contact.user_name}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Selection */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Select Currency</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCurrency('usdc')}
              className={`flex-1 p-2 rounded-lg ${
                selectedCurrency === 'usdc'
                  ? 'bg-purple-600 text-white'
                  : 'bg-blue-800 text-gray-300 hover:bg-blue-700'
              }`}
            >
              USDC
            </button>
            <button
              onClick={() => setSelectedCurrency('xion')}
              className={`flex-1 p-2 rounded-lg ${
                selectedCurrency === 'xion'
                  ? 'bg-purple-600 text-white'
                  : 'bg-blue-800 text-gray-300 hover:bg-blue-700'
              }`}
            >
              XION
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-2 rounded-lg bg-blue-800 border border-blue-700 text-white"
            />
            <div className="absolute right-2 top-2 text-gray-400">
              {selectedCurrency.toUpperCase()}
            </div>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Available: {getFormattedBalance(selectedCurrency)}
          </div>
        </div>

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={!selectedContact || !amount || amount === '0'}
          className="w-full p-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Send Payment
        </button>

        {/* Transaction Status */}
        {transactionStatus.status !== 'pending' || transactionStatus.progress! > 0 ? (
          <div className={`mt-4 p-3 rounded-lg ${
            transactionStatus.status === 'success'
              ? 'bg-green-600 text-white'
              : transactionStatus.status === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-800 text-white'
          }`}>
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
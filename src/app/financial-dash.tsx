'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { getAccountBalance } from './web3/xion_rpc';

// Interface that matches the actual backend response
interface BackendTransaction {
  transaction_id: string;
  source: string;
  destination: string;
  currency: string;
  value: number;
  taxes: number;
  status: string;
  transaction_type: string;
  year: number;
  month: number;
  user_id: string;
  created_at: string;
}

interface Balance {
  denom: string;
  amount: string;
}

interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

// Helper function to format date safely
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy HH:mm');
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

export default function FinancialDashboard() {
  const { data: { bech32Address } } = useAbstraxionAccount();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

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

  // Helper function to fetch user's transactions
  const fetchTransactions = async (userName: string, quantity = 5) => {
    try {
      const response = await fetch(`/api/payment/history/latest/${userName}?user_name=${userName}&quantity=${quantity}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Return the actual array from the response
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  };

  // Helper function to fetch payment history
  const fetchPaymentHistory = async (userName: string) => {
    try {
      const response = await fetch(`/api/payment/history/${userName}?user_name=${userName}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payment history: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Return the actual array from the response
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching payment history:', err);
      throw err;
    }
  };

  // Helper function to calculate monthly summaries from transactions
  const calculateMonthlySummaries = useCallback((transactions: BackendTransaction[]): MonthlySummary[] => {
    const summaryMap = new Map<string, { income: number; expenses: number }>();
    
    transactions.forEach(transaction => {
      try {
        // Create a month-year string using the year and month fields from the transaction
        const monthYear = `${getMonthName(transaction.month)} ${transaction.year}`;
        
        // Determine if this is income or expense based on transaction_type
        const isIncome = ['deposit', 'credit', 'refund'].includes(transaction.transaction_type.toLowerCase());
        const amount = transaction.value || 0;
        
        if (!summaryMap.has(monthYear)) {
          summaryMap.set(monthYear, { income: 0, expenses: 0 });
        }
        
        const summary = summaryMap.get(monthYear)!;
        if (isIncome) {
          summary.income += amount;
        } else {
          summary.expenses += amount;
        }
      } catch (e) {
        console.error('Error processing transaction for monthly summary:', e);
      }
    });
    
    // Convert map to array and calculate net values
    const result: MonthlySummary[] = [];
    summaryMap.forEach((value, month) => {
      result.push({
        month,
        income: value.income,
        expenses: value.expenses,
        net: value.income - value.expenses
      });
    });
    
    // Sort by most recent month first (assuming the month string format is "Month YYYY")
    return result.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      if (aYear !== bYear) {
        return parseInt(bYear) - parseInt(aYear);
      }
      
      // Compare months (convert month names to numbers for comparison)
      const aMonthNum = getMonthNumber(aMonth);
      const bMonthNum = getMonthNumber(bMonth);
      return bMonthNum - aMonthNum;
    });
  }, []);

  // Helper function to get month name from number
  const getMonthName = (monthNumber: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    // Adjust for 0-based index or 1-based month number
    const index = monthNumber - 1;
    return months[index >= 0 && index < 12 ? index : 0];
  };
  
  // Helper function to get month number from name
  const getMonthNumber = (monthName: string): number => {
    const months = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
      'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    return months[monthName.toLowerCase() as keyof typeof months] || 0;
  };

  // Fetch user name from bech32Address 
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

  // Main data fetching effect - runs when userId is available
  useEffect(() => {
    const fetchData = async () => {
      if (!bech32Address || !userId) return;
      
      try {
        setLoading(true);
        
        // Fetch balances
        const balancesResponse = await getAccountBalance(bech32Address);
        setBalances(balancesResponse.balances);

        // Fetch transactions using the new API endpoint
        const transactionsData = await fetchTransactions(userId);
        setTransactions(transactionsData);

        // Fetch all payment history for monthly summaries
        const historyData = await fetchPaymentHistory(userId);
        const summaries = calculateMonthlySummaries(historyData);
        setMonthlySummaries(summaries);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bech32Address, userId, calculateMonthlySummaries]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-blue-900 text-white p-4 items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-blue-900 text-white p-4 items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-blue-900 text-white p-4">
      <div className="flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Financial Dashboard</h1>

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

        {/* Recent Transactions */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="bg-blue-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-700">
                  <th className="text-left p-4 text-gray-300">Date</th>
                  <th className="text-left p-4 text-gray-300">Type</th>
                  <th className="text-left p-4 text-gray-300">Amount</th>
                  <th className="text-left p-4 text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="border-b border-blue-700">
                      <td className="p-4">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="p-4">
                        {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                      </td>
                      <td className={`p-4 ${
                        ['deposit', 'credit', 'refund'].includes(transaction.transaction_type.toLowerCase()) 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {['deposit', 'credit', 'refund'].includes(transaction.transaction_type.toLowerCase()) ? '+' : '-'}
                        {transaction.value.toFixed(6)} {transaction.currency}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status.toLowerCase() === 'completed' ? 'bg-green-600' : 
                          transaction.status.toLowerCase() === 'pending' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center">No recent transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Summary */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Monthly Summary</h2>
          <div className="bg-blue-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-700">
                  <th className="text-left p-4 text-gray-300">Month</th>
                  <th className="text-left p-4 text-gray-300">Income</th>
                  <th className="text-left p-4 text-gray-300">Expenses</th>
                  <th className="text-left p-4 text-gray-300">Net</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaries.length > 0 ? (
                  monthlySummaries.map((summary) => (
                    <tr key={summary.month} className="border-b border-blue-700">
                      <td className="p-4">{summary.month}</td>
                      <td className="p-4 text-green-400">${summary.income.toFixed(2)}</td>
                      <td className="p-4 text-red-400">${summary.expenses.toFixed(2)}</td>
                      <td className={`p-4 ${
                        summary.net >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${summary.net.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center">No monthly summary data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
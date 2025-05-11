'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  user_name: string;
  email: string;
  account_id: string;
}

export default function ModifyUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
  });

  useEffect(() => {
    // Get the account_id from localStorage
    const accountId = localStorage.getItem('bech32Address');
    if (!accountId) {
      router.push('/financial-dash');
      return;
    }

    // Fetch user data
    fetchUserData(accountId);
  }, [router]);

  const fetchUserData = async (accountId: string) => {
    try {
      const response = await fetch(`/api/user/account/${accountId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setUser(data);
      setFormData({
        user_name: data.user_name,
        email: data.email,
      });
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateUserName = (username: string): boolean => {
    const usernameRegex = /^[a-z0-9]{5,}$/;
    return usernameRegex.test(username);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateUserName(formData.user_name)) {
      setError('Username must be at least 5 characters long and contain only lowercase letters and numbers');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: user?.account_id,
          user_name: formData.user_name,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user data');
      }

      setSuccess('User information updated successfully');
      // Refresh user data
      if (user?.account_id) {
        fetchUserData(user.account_id);
      }
    } catch (err) {
      setError('Failed to update user information');
      console.error('Error updating user information:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-blue-900 text-white p-4 items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-blue-900 text-white p-4">
      <div className="max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Modify User Information</h1>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Account ID</label>
            <input
              type="text"
              value={user?.account_id || ''}
              disabled
              className="w-full p-2 bg-blue-800 rounded-lg text-gray-300"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              className="w-full p-2 bg-blue-800 rounded-lg text-white"
              placeholder="Enter new username"
            />
            <p className="text-sm text-gray-400 mt-1">
              Username must be at least 5 characters long and contain only lowercase letters and numbers
            </p>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 bg-blue-800 rounded-lg text-white"
              placeholder="Enter new email"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Update Information
          </button>
        </form>
      </div>
    </div>
  );
} 
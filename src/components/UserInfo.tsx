import { useState } from 'react';

interface UserInfoProps {
  bech32Address: string;
  isLoadingUserInfo: boolean;
  showNewUserForm: boolean;
  userInfo: { user_name: string; email: string } | null;
  onUserCreated: (userInfo: { user_name: string; email: string }) => void;
}

export default function UserInfo({ 
  bech32Address, 
  isLoadingUserInfo, 
  showNewUserForm, 
  userInfo,
  onUserCreated 
}: UserInfoProps) {
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const validateUserName = (username: string): boolean => {
    const usernameRegex = /^[a-z0-9]{5,}$/;
    return usernameRegex.test(username);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateUserName(formData.user_name)) {
      setFormError('Username must be at least 5 characters long and contain only lowercase letters and numbers');
      return;
    }

    if (!validateEmail(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: bech32Address,
          user_name: formData.user_name,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const data = await response.json();
      onUserCreated(data);
    } catch (err) {
      setFormError('Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  return (
    <div className="border-2 border-purple-500 rounded-md p-4 flex flex-row gap-4">
      <div className="flex flex-row gap-6">
        <div>
          address
        </div>
        <div>
          {bech32Address}
          {isLoadingUserInfo ? (
            <div className="mt-2 text-sm text-gray-300">Loading your chat user info...</div>
          ) : showNewUserForm ? (
            <div className="mt-4">
              <p className="text-sm text-gray-300 mb-4">
                You are a new account user! Let&apos;s set your user id and you may also set your email, if desired.
              </p>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {formError && (
                  <div className="text-red-500 text-sm">{formError}</div>
                )}
                <div>
                  <label className="block text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                    className="w-full p-2 bg-blue-800 rounded-lg text-white"
                    placeholder="Enter username"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Must be at least 5 characters long and contain only lowercase letters and numbers
                  </p>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 bg-blue-800 rounded-lg text-white"
                    placeholder="Enter email"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create User
                </button>
              </form>
            </div>
          ) : userInfo ? (
            <div className="mt-2 text-sm text-gray-300">
              <div>Username: {userInfo.user_name}</div>
              <div>Email: {userInfo.email}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
} 
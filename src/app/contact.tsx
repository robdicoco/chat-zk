'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';

interface Contact {
  id: string;
  user_name: string;
  email: string;
  account_id: string;
  created_at: string;
}

interface InviteFormProps {
  initialEmail: string;
  onClose: () => void;
  currentUserName: string;
}

function InviteForm({ initialEmail, onClose, currentUserName }: InviteFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/contact/invite?user_name=${encodeURIComponent(currentUserName)}&email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send invite');
      }

      setSuccess('Invitation sent successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-blue-800 p-6 rounded-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Send Invitation</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full bg-blue-700 text-white px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ContactPageProps {
  onContactSelect: (contact: Contact) => void;
}

export default function ContactPage({ onContactSelect }: ContactPageProps) {
  const { data: { bech32Address } } = useAbstraxionAccount();
  const [addedByOthers, setAddedByOthers] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContactIdentifier, setNewContactIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  const fetchUserName = async () => {
    if (!bech32Address) return;
    try {
      const response = await fetch(`/api/user/account/${bech32Address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user name');
      }
      const data = await response.json();
      setCurrentUserName(data.user_name);
      console.log('Current user name:', data.user_name);
    } catch (err) {
      console.error('Error fetching user name:', err);
    }
  };

  const fetchContacts = useCallback(async () => {
    if (!bech32Address) return;
    
    try {
      const addedRes = await fetch(`/api/contact/added_by_others?account_id=${bech32Address}`);
      if (addedRes.ok) {
        setAddedByOthers(await addedRes.json());
      }
    } catch {};

    try {
      const response = await fetch(`/api/contact/list?account_id=${bech32Address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      const data = await response.json();
      console.log('Received contacts:', data);
      setContacts(data);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [bech32Address]); 

  useEffect(() => {
    fetchContacts();
  }, [bech32Address, fetchContacts]);

  useEffect(() => {
    fetchUserName();
  }, [bech32Address, fetchUserName]);

  const handleAddContact = async () => {
    if (!newContactIdentifier.trim() || !bech32Address) return;

    try {
      const response = await fetch('/api/contact/add_by_identifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: bech32Address,
          identifier: newContactIdentifier.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Contact not found') {
          setError(`This contact ${newContactIdentifier} is not at ChatPay Go yet!`);
          return;
        }
        throw new Error(errorData.error || 'Failed to add contact');
      }

      setSuccess('Contact added successfully');
      setNewContactIdentifier('');
      fetchContacts(); // Refresh the contact list
      fetchUserName(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      console.error('Error adding contact:', err);
    }
  };

  const handleContactClick = (contact: Contact) => {
    onContactSelect(contact);
  };

  // Add a user who added me into my contacts
  const handleAddFromOthers = async (contact: Contact) => {
    if (!bech32Address) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/contact/add_by_identifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: bech32Address, identifier: contact.account_id }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add contact');
      }
      setSuccess(`Added ${contact.user_name} to contacts`);
      // Refresh both contact lists
      fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-blue-900 text-white p-4 items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-blue-900 text-white p-4">
      <div className="flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Contacts</h1>

        {/* Add Contact Form */}
        <div className="mb-6 bg-blue-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newContactIdentifier}
              onChange={(e) => setNewContactIdentifier(e.target.value)}
              placeholder="Enter contact identifier (email or account ID)"
              className="flex-1 bg-blue-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddContact}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add Contact
            </button>
          </div>
          {error && (
            <div className="mt-2">
              <p className="text-red-500">{error}</p>
              {error.includes('is not at ChatPay Go yet') && (
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="text-blue-400 hover:text-blue-300 underline mt-2"
                >
                  Send an invite to ChatPay Go
                </button>
              )}
            </div>
          )}
          {success && (
            <p className="text-green-500 mt-2">{success}</p>
          )}
        </div>

        {showInviteForm && (
          <InviteForm
            initialEmail={newContactIdentifier.includes('@') ? newContactIdentifier : ''}
            onClose={() => setShowInviteForm(false)}
            currentUserName={currentUserName}
          />
        )}

        {/* Contacts List */}
        {addedByOthers.length > 0 && (
          <div className="mb-6 bg-blue-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">You were added by:</h2>
            <ul className="space-y-2">
              {addedByOthers.map((contact) => (
                <li key={contact.id} className="flex justify-between items-center">
                  <span>{contact.user_name}</span>
                  <button
                    onClick={() => handleAddFromOthers(contact)}
                    className="text-green-400 hover:text-green-300"
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="bg-blue-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-700">
                <th className="text-left p-4 text-gray-300">Username</th>
                <th className="text-left p-4 text-gray-300">Email</th>
                <th className="text-left p-4 text-gray-300">Account ID</th>
                <th className="text-left p-4 text-gray-300">Added On</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="border-b border-blue-700 hover:bg-blue-700 cursor-pointer transition-colors"
                    onClick={() => handleContactClick(contact)}
                  >
                    <td className="p-4">{contact.user_name}</td>
                    <td className="p-4">{contact.email || '-'}</td>
                    <td className="p-4">{contact.account_id}</td>
                    <td className="p-4">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

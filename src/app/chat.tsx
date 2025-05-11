'use client';

import { useState, useEffect, useRef } from 'react';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { useSearchParams } from 'next/navigation';
// import { FaArrowLeft, FaPaperPlane, FaEllipsisV, FaImage, FaFile, FaMicrophone } from 'react-icons/fa';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  reply_to?: string;
}

interface Contact {
  id: string;
  user_name: string;
  email: string;
  account_id: string;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  messages: Message[];
  updated_at: string;
}

interface ChatPageProps {
  contact: Contact | null;
  onNavigate?: (page: string, params?: { contactId?: string }) => void;
}

export default function ChatPage({ contact: initialContact, onNavigate }: ChatPageProps) {
  const searchParams = useSearchParams();
  const { data: { bech32Address } } = useAbstraxionAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contact, setContact] = useState<Contact | null>(initialContact);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [, setUserId] = useState<string | null>(null);
  const [, setLastMessageTimestamp] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  console.log('Initial Contact:', initialContact);
  console.log('Current Contact State:', contact);
  console.log('Search Params:', searchParams.get('contact'));

  // Fetch user ID when bech32Address changes
  useEffect(() => {
    const fetchUserId = async () => {
      if (!bech32Address) return;
      try {
        const response = await fetch(`/api/user/account/${bech32Address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user ID');
        }
        const data = await response.json();
        setUserId(data.id);
      } catch (err) {
        console.error('Error fetching user ID:', err);
      }
    };
    fetchUserId();
  }, [bech32Address]);

  // Get contact from either props or URL params
  useEffect(() => {
    const contactId = searchParams.get('contact');
    console.log('Contact ID from URL:', contactId);
    console.log('Current Contact:', contact);
    
    if (contactId && !contact) {
      console.log('Fetching contact details...');
      // Fetch contact details if we only have the ID
      const fetchContact = async () => {
        try {
          console.log('Fetching contacts for:', bech32Address);
          const response = await fetch(`/api/contact/list?account_id=${bech32Address}`);
          if (!response.ok) {
            throw new Error('Failed to fetch contact');
          }
          const contacts = await response.json();
          console.log('Fetched contacts:', contacts);
          const foundContact = contacts.find((c: Contact) => c.account_id === contactId);
          console.log('Found contact:', foundContact);
          if (foundContact) {
            setContact(foundContact);
          }
        } catch (err) {
          console.error('Error fetching contact:', err);
        }
      };
      fetchContact();
    }
  }, [searchParams, contact, bech32Address]);

  // Fetch conversation when contact changes
  useEffect(() => {
    const fetchConversation = async () => {
      if (!bech32Address || !contact?.account_id) return;
      try {
        const response = await fetch(
          `/api/message/conversation_accounts/${bech32Address}?third_party_account_id=${contact.account_id}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch conversation');
        }
        const data = await response.json();
        setConversation(data);
        setMessages(data.messages || []);
        if (data.messages && data.messages.length > 0) {
          setLastMessageTimestamp(data.messages[data.messages.length - 1].created_at);
        }
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [bech32Address, contact?.account_id]);

  // Poll for new messages
  useEffect(() => {
    if (!conversation?.id || !bech32Address) return;

    const pollForMessages = async () => {
      try {
        const response = await fetch(
          `/api/message/conversation_accounts/${bech32Address}?third_party_account_id=${contact?.account_id}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        
        // Only update if there are new messages
        if (data.messages && data.messages.length > messages.length) {
          setMessages(data.messages);
          setLastMessageTimestamp(data.messages[data.messages.length - 1].created_at);
        }
      } catch (err) {
        console.error('Error polling for messages:', err);
      }
    };

    // Poll every 30 seconds
    pollingIntervalRef.current = setInterval(pollForMessages, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [conversation?.id, bech32Address, contact?.account_id, messages.length]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id || !bech32Address) return;
  
    try {
      const response = await fetch('/api/message/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          conversation_id: conversation.id,
          sender_id: bech32Address, // Use bech32Address instead of userId
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
  
      const data = await response.json();
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setLastMessageTimestamp(data.created_at);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handlePay = () => {
    if (!contact) return;
    onNavigate?.('payments', { contactId: contact.account_id });
  };

  if (!contact) {
    console.log('No contact available, showing selection message');
    return (
      <div className="flex flex-col h-screen bg-blue-900 text-white p-4 items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Select a contact to start chatting</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-blue-900 text-white p-4 items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading chat...</p>
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
    <div className="flex flex-col h-screen bg-blue-900 text-white">
      {/* Header */}
      <div className="bg-blue-800 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">{contact?.user_name || 'Chat'}</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.sender_id === bech32Address ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.sender_id === bech32Address
                  ? 'bg-purple-600'
                  : 'bg-blue-700'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-blue-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-blue-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handlePay}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Pay
          </button>
          <button
            onClick={handleSendMessage}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useModal,
} from "@burnt-labs/abstraxion";
// import { StyleSheet, Button, View, Text, Alert } from 'react-native';
import { Button } from "@burnt-labs/ui";
// import type { InstantiateResult } from "@cosmjs/cosmwasm-stargate";
// import Link from "next/link";
import { useEffect, useState } from "react";
// import Image from "next/image";
// import { SignArb } from "../components/sign-arb";
import BaseButtons from "./base_buttons";
import GearButtons from "./gear_buttons";
import ContactPage from "./contact";
import ChatPage from "./chat";
import FinancialDashboard from "./financial-dash";
import GiftTransferPage from "./gift_transfer";
import GiftReceivePage from "./gift_receive";
import GiftReturnPage from "./gift_return";
import TransferPage from "./transfer";
// import { useRouter } from 'next/navigation';

import Logo from '../ui/Logo';
import UserInfo from '../components/UserInfo';

// type InstantiateResultOrUndefined = InstantiateResult | undefined;

export default function Home() {
  // Abstraxion hooks
  const { data: { bech32Address }, isConnected, isConnecting } = useAbstraxionAccount();
  const { client, logout } = useAbstraxionSigningClient();

  // console.log('bech32Address:', bech32Address,':');

  // General state hooks
  const [, setShowModal]: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>,
  ] = useModal();

  const [loading, ] = useState(false);
  // const [instantiateResult, _setInstantiateResult] = useState<InstantiateResultOrUndefined>(undefined);
  const [gearMenuOpen, setGearMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedContact, setSelectedContact] = useState<{ id: string; user_name: string; email: string; account_id: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ user_name: string; email: string } | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // const blockExplorerUrl = `https://www.mintscan.io/xion-testnet/tx/${instantiateResult?.transactionHash}`;

  // const router = useRouter();

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
      setUserInfo(data);
      setShowNewUserForm(false);
    } catch (err) {
      setFormError('Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!bech32Address) return;
      try {
        const response = await fetch(`/api/user/account/${bech32Address}`);
        if (response.status === 404) {
          setShowNewUserForm(true);
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setUserInfo(data);
      } catch (err) {
        console.error('Error fetching user info:', err);
      } finally {
        setIsLoadingUserInfo(false);
      }
    };

    fetchUserInfo();
  }, [bech32Address]);

  // watch isConnected and isConnecting
  useEffect(() => {
    console.log({ isConnected, isConnecting });
  }, [isConnected, isConnecting])

  const handleUserCreated = (newUserInfo: { user_name: string; email: string }) => {
    setUserInfo(newUserInfo);
    setShowNewUserForm(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'contacts':
        return <ContactPage onContactSelect={(contact) => {
          setSelectedContact(contact);
          setCurrentPage('chat');
        }} />;
      case 'chat':
        return <ChatPage 
          contact={selectedContact} 
          onNavigate={(page, params) => {
            setCurrentPage(page);
            if (params?.contactId) {
              setSelectedContact({ 
                id: '', 
                user_name: '', 
                email: '', 
                account_id: params.contactId 
              });
            }
          }} 
        />;
      case 'payments':
        return <TransferPage />;
      case 'home':
        return <FinancialDashboard />;
      case 'send-gift': 
          return <GiftTransferPage />;
      case 'receive-gift': 
        return <GiftReceivePage />;
      case 'return-gift':
        return <GiftReturnPage />;
      default:
        return (
          <main className="flex-grow flex flex-col items-center justify-center gap-6 p-6 mt-8 sm:mt-16">
            <div className="flex justify-center mb-8 sm:mb-12">
              <Logo size={100} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter gradient-text">
              ChatPay Go
            </h1>
            {bech32Address? null :<Button
              fullWidth
              onClick={() => { setShowModal(true) }}
              structure="base"
              className="max-w-[300px] mx-auto bg-purple-600 text-white hover:bg-purple-700"
            >
             CONNECT
            </Button>}

            {bech32Address && (
              <UserInfo
                bech32Address={bech32Address}
                isLoadingUserInfo={isLoadingUserInfo}
                showNewUserForm={showNewUserForm}
                userInfo={userInfo}
                onUserCreated={handleUserCreated}
              />
            )}
            <Abstraxion onClose={() => setShowModal(false)} />
          </main>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-blue-900 text-white">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-900">
        <div className="flex items-center justify-between p-4">
          {<GearButtons 
           onGearClick={() => setGearMenuOpen(!gearMenuOpen)}  
           onHomeClick={() => setCurrentPage('initial')}/>}

          {bech32Address && gearMenuOpen && (
            <div className="fixed top-16 right-4 bg-white shadow-lg rounded p-4 z-50">
              {client ? (
                <>
                  <Button
                    fullWidth
                    onClick={() => {
                      setCurrentPage('send-gift');
                      setGearMenuOpen(false);
                    }}
                    structure="base"
                    className="bg-purple-600 text-white hover:bg-purple-700 mb-2"
                  >
                    Send a Gift
                  </Button>
                  <Button
                    fullWidth
                      onClick={() => {
                      setCurrentPage('receive-gift');
                      setGearMenuOpen(false);
                    }}
                    structure="base"
                    className="bg-purple-600 text-white hover:bg-purple-700 mb-2"
                  >
                    Receive a Gift
                  </Button>
                  <Button
                    fullWidth
                      onClick={() => {
                      setCurrentPage('return-gift');
                      setGearMenuOpen(false);
                    }}
                    structure="base"
                    className="bg-purple-600 text-white hover:bg-purple-700 mb-2"
                  >
                    Return a Gift
                  </Button>
                  {logout && (
                    <Button
                      disabled={loading}
                      fullWidth
                      onClick={() => {
                        logout();
                        setGearMenuOpen(false);
                        setCurrentPage('login');
                      }}
                      structure="base"
                      className="max-w-[300px] mx-auto bg-purple-600 text-white hover:bg-purple-700"
                    >
                      LOGOUT
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-16 pb-16"> {/* Added padding-top to account for fixed header and padding-bottom for fixed footer */}
        <div className="container mx-auto px-4">
          
 
          <div className="container mx-auto px-4 relative">{renderPage()}</div>
          
          
          
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-900">
        <div className="flex items-center justify-between p-4">
          {bech32Address &&  <BaseButtons 
              activePath={currentPage} 
              onNavigate={(path) => {
                if (path === 'chat' && !selectedContact) {
                  setCurrentPage('contacts');
                } else {
                  setCurrentPage(path);
                }
              }}
            />}
        </div>
      </div>
    </div>
  );
}
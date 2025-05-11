"use client";
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useModal,
} from "@burnt-labs/abstraxion";
// import { StyleSheet, Button, View, Text, Alert } from 'react-native';
import { Button } from "@burnt-labs/ui";
import type { InstantiateResult } from "@cosmjs/cosmwasm-stargate";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { SignArb } from "../components/sign-arb";

import Logo from '../ui/Logo';

type InstantiateResultOrUndefined = InstantiateResult | undefined;

export default function Home() {
  // Abstraxion hooks
  const { data: { bech32Address }, isConnected, isConnecting } = useAbstraxionAccount();
  const { client, signArb } = useAbstraxionSigningClient();

  // General state hooks
  const [, setShowModal]: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>,
  ] = useModal();

  const [loading, setLoading] = useState(false);
  const [instantiateResult, setInstantiateResult] =
    useState<InstantiateResultOrUndefined>(undefined);

  const blockExplorerUrl = `https://www.mintscan.io/xion-testnet/tx/${instantiateResult?.transactionHash}`;


  async function claimSeat(): Promise<void> {
    setLoading(true);

    try {
      // Use "auto" fee for most transactions
      // Sample treasury contract instantiate msg
      const msg = {
        type_urls: ["/cosmwasm.wasm.v1.MsgInstantiateContract"],
        grant_configs: [
          {
            description: "Ability to instantiate contracts",
            optional: false,
            authorization: {
              type_url: "/cosmos.authz.v1beta1.GenericAuthorization",
              value: "CigvY29zbXdhc20ud2FzbS52MS5Nc2dJbnN0YW50aWF0ZUNvbnRyYWN0",
            },
          },
        ],
        fee_config: {
          description: "Sample fee config for testnet-2",
          allowance: {
            type_url: "/cosmos.feegrant.v1beta1.BasicAllowance",
            value: "Cg8KBXV4aW9uEgY1MDAwMDA=",
          },
        },
        admin: bech32Address,
      };

      const instantiateRes = await client?.instantiate(
        bech32Address,
        33,
        msg,
        "instantiate on expo demo",
        "auto",
      );

      console.log(instantiateRes);

      if (!instantiateRes) {
        throw new Error("Instantiate failed.");
      }

      setInstantiateResult(instantiateRes);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }
  // watch isConnected and isConnecting
  useEffect(() => {
    console.log({ isConnected, isConnecting });
  }, [isConnected, isConnecting])

  return (
    <div className="flex flex-col min-h-screen bg-blue-900">
      <main className="flex-grow flex flex-col items-center justify-center gap-4 p-4">
        <div className="flex justify-center mb-12">
          <Logo size={120} />
        </div>
        <h1 className="text-2xl font-bold tracking-tighter text-gray-300">
          ChatPay Go
        </h1>
        <Button
          fullWidth
          onClick={() => { setShowModal(true) }}
          structure="base"
          className="max-w-[300px] mx-auto bg-purple-600 text-white hover:bg-purple-700"
        >
          {bech32Address ? (
            <div className="flex items-center justify-center">VIEW ACCOUNT</div>
          ) : (
            "CONNECT"
          )}
        </Button>
        {
          bech32Address ? (
            <>
              <Button
                disabled={loading}
                fullWidth
                onClick={() => {
                  alert("Send a Gift functionality coming soon!");
                }}
                structure="base"
                className="max-w-[300px] mx-auto bg-purple-600 text-white hover:bg-purple-700"
              >
                SEND A GIFT
              </Button>
              <Button
                disabled={loading}
                fullWidth
                onClick={() => {
                  alert("Send a payment functionality coming soon!");
                }}
                structure="base"
                className="max-w-[300px] mx-auto bg-purple-600 text-white hover:bg-purple-700"
              >
                SEND PAYMENT
              </Button>
            </>
          ) : null}
        {client ? (
          <>
            <Button
              disabled={loading}
              fullWidth
              onClick={() => {
                void claimSeat();
              }}
              structure="base"
              className="max-w-[300px] mx-auto bg-purple-600 text-white hover:bg-purple-700"
            >
              {loading ? "LOADING..." : "Instantiate Sample Treasury"}
            </Button>
            
            {signArb ? <SignArb /> : null}
          </>
        ) : null}
        {
          bech32Address &&
          <div className="border-2 border-purple-500 rounded-md p-4 flex flex-row gap-4">
            <div className="flex flex-row gap-6">
              <div>
                address
              </div>
              <div>
                {bech32Address}
              </div>
            </div>
          </div>
        }
        <Abstraxion onClose={() => setShowModal(false)} />
        {instantiateResult ? (
          <div className="flex flex-col rounded border-2 border-purple-500 p-2">
            <div className="mt-2">
              <p className="text-zinc-400">
                <span className="font-bold">Transaction Hash</span>
              </p>
              <p className="text-sm">{instantiateResult.transactionHash}</p>
            </div>
            <div className="mt-2">
              <p className=" text-zinc-400">
                <span className="font-bold">Block Height:</span>
              </p>
              <p className="text-sm">{instantiateResult.height}</p>
            </div>
            <div className="mt-2">
              <Link
                className="text-purple-400 underline visited:text-purple-300 hover:text-purple-200"
                href={blockExplorerUrl}
                target="_blank"
              >
                View in Block Explorer
              </Link>
            </div>
          </div>
        ) : null}
      </main>
      <footer className="flex gap-[24px] flex-wrap items-center justify-center p-4 border-t border-gray-700">
        <a
          className="flex items-center gap-2 text-gray-300 hover:text-white hover:underline hover:underline-offset-4"
          href="https://xion.burnt.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn about XION
        </a>
        <a
          className="flex items-center gap-2 text-gray-300 hover:text-white hover:underline hover:underline-offset-4"
          href="https://github.com/vanbarros76/chatpay-go"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Code on GitHub
        </a>
        <a
          className="flex items-center gap-2 text-gray-300 hover:text-white hover:underline hover:underline-offset-4"
          href="http://chatpaygo.758206.xyz/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Home ChatPay GO →
        </a>
      </footer>
    </div>
  );
}
import { useAbstraxionSigningClient, useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useState } from "react";
import { toast } from "react-hot-toast"; 

// Types
export interface ExecuteResult {
  transactionHash: string;
  height: number;
  success: boolean;
  error?: string;
}

export interface TransferParams {
  recipient: string;
  amount: string;
  denom: string;
}

export const useWeb3Helper = () => {
  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecuteResult | null>(null);

  /**
   * Execute a contract with the given contract address and message
   */
  const executeContract = async (
    contractAddress: string,
    executeMsg: Record<string, unknown>,
    memo = "",
    funds: { denom: string; amount: string }[] = []
  ): Promise<ExecuteResult> => {
    if (!client || !account.bech32Address) {
      throw new Error("Client or account not available. Please connect your wallet.");
    }

    setExecuting(true);

    
    try {
      console.log('Executing contract with funds23:', funds);
      console.log('Executing contract with executeMsg2:', executeMsg);
      console.log('Executing contract with memo2:', memo);
      console.log('Executing contract with contractAddress2:', contractAddress);

      const result = await client.execute(
        account.bech32Address,
        contractAddress,
        executeMsg,
        "auto", // Default gas estimation
        memo,
        funds
      );

      const executeResult = {
        transactionHash: result.transactionHash,
        height: result.height,
        success: true
      };

      setLastResult(executeResult);
      return executeResult;
    } catch (error: unknown) {
      console.error("Contract execution failed:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Contract execution failed";
      
      const errorResult = {
        transactionHash: "",
        height: 0,
        success: false,
        error: errorMessage
      };
      
      setLastResult(errorResult);
      throw error;
    } finally {
      setExecuting(false);
    }
  };

  /**
   * Transfer tokens using bank module
   */
  const transferTokens = async ({ recipient, amount, denom }: TransferParams): Promise<ExecuteResult> => {
    if (!client || !account.bech32Address) {
      throw new Error("Client or account not available. Please connect your wallet.");
    }

    setExecuting(true);
    
    try {
      const result = await client.sendTokens(
        account.bech32Address,
        recipient,
        [{ denom, amount }],
        "auto" // Default gas estimation
      );

      const transferResult = {
        transactionHash: result.transactionHash,
        height: result.height,
        success: true
      };

      setLastResult(transferResult);
      return transferResult;
    } catch (error: unknown) {
      console.error("Token transfer failed:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Token transfer failed";
      
      const errorResult = {
        transactionHash: "",
        height: 0,
        success: false,
        error: errorMessage
      };
      
      setLastResult(errorResult);
      throw error;
    } finally {
      setExecuting(false);
    }
  };

  /**
   * Query contract state
   */
  const queryContract = async (contractAddress: string, queryMsg: Record<string, unknown>) => {
    if (!client) {
      throw new Error("Client not available. Please connect your wallet.");
    }

    try {
      return await client.queryContractSmart(contractAddress, queryMsg);
    } catch (error: unknown) {
      console.error("Contract query failed:", error);
      throw error;
    }
  };

  /**
   * Get account balance for a specific denom
   */
  const getBalance = async (address: string, denom: string): Promise<string> => {
    if (!client) {
      throw new Error("Client not available. Please connect your wallet.");
    }

    try {
      const balance = await client.getBalance(address, denom);
      return balance.amount;
    } catch (error) {
      console.error("Failed to get balance:", error);
      return "0";
    }
  };

  /**
   * Execute a transfer with progress tracking and notifications
   */
  const executeTransferWithFeedback = async (transferParams: TransferParams): Promise<ExecuteResult> => {
    if (!account.bech32Address) {
      toast.error("Please connect your wallet");
      throw new Error("Wallet not connected");
    }

    toast.loading("Preparing transaction...");
    
    try {
      // Validate sufficient balance
      const balance = await getBalance(account.bech32Address, transferParams.denom);
      if (BigInt(balance) < BigInt(transferParams.amount)) {
        toast.dismiss();
        toast.error("Insufficient balance");
        throw new Error("Insufficient balance");
      }

      toast.dismiss();
      toast.loading("Executing transfer...");
      
      const result = await transferTokens(transferParams);
      
      toast.dismiss();
      toast.success("Transfer completed successfully!");
      
      return result;
    } catch (error: unknown) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : "Transfer failed";
      toast.error(errorMessage);
      throw error;
    }
  };

  /**
   * Execute a contract with progress tracking and notifications
   */
  const executeContractWithFeedback = async (
    contractAddress: string,
    executeMsg: Record<string, unknown>,
    memo = "",
    funds: { denom: string; amount: string }[] = []
  ): Promise<ExecuteResult> => {
    if (!account.bech32Address) {
      toast.error("Please connect your wallet");
      throw new Error("Wallet not connected");
    }

    toast.loading("Preparing contract execution...");
    
    try {
      // If funds are being sent, validate balance for each denom
      if (funds.length > 0) {
        for (const fund of funds) {
          const balance = await getBalance(account.bech32Address, fund.denom);
          if (BigInt(balance) < BigInt(fund.amount)) {
            toast.dismiss();
            toast.error(`Insufficient balance for ${fund.denom}`);
            throw new Error(`Insufficient balance for ${fund.denom}`);
          }
        }
      }

      toast.dismiss();
      toast.loading("Executing contract...");
      
      const result = await executeContract(contractAddress, executeMsg, memo, funds);
      
      toast.dismiss();
      toast.success("Contract executed successfully!");
      
      return result;
    } catch (error: unknown) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : "Contract execution failed";
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    executeContract,
    transferTokens,
    queryContract,
    getBalance,
    executeTransferWithFeedback,
    executeContractWithFeedback,
    executing,
    lastResult,
    isConnected: Boolean(client && account.bech32Address)
  };
};
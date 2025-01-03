"use client";

declare global {
  interface Window {
    klaytn: any;
    ethereum: any;
  }
}

import React, { createContext, useContext, useEffect, useState } from "react";
import DappPortalSDK, { WalletType } from "@linenext/dapp-portal-sdk";
import { ethers } from "ethers";
import { Web3Provider as w3 } from "@kaiachain/ethers-ext/v6";
import { stringify, parse } from "flatted";
import { useLiff } from "./LiffProvider.tsx";
import { Identity } from "@semaphore-protocol/identity";
import { createIdentity } from "../hooks/browser/survey.tsx";

const WALLET_PROVIDER_KEY = "walletProvider";
const WALLET_ACCOUNT_KEY = "walletAccount";
const WALLET_IS_CONNECTED_KEY = "isWalletConnected";
const SEMAPHORE_IDENTITY_KEY = "semaphoreIdentity";

interface Web3ContextType {
  provider: w3 | null;
  // provider: ethers.BrowserProvider | null;
  account: string | null;
  identity: Identity | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [provider, setProvider] = useState<w3 | null>(null);
  // const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const { liffObject, liffError } = useLiff();

  // liff.login() make the page reload, so we need to load the state from the session storage
  useEffect(() => {
    const storedProvider = sessionStorage.getItem(WALLET_PROVIDER_KEY);
    const storedAccount = sessionStorage.getItem(WALLET_ACCOUNT_KEY);
    const storedIsConnected = sessionStorage.getItem(WALLET_IS_CONNECTED_KEY);
    const storedIdentity = sessionStorage.getItem(SEMAPHORE_IDENTITY_KEY);
    if (storedProvider) {
      setProvider(new w3(parse(storedProvider)));
    }
    if (storedAccount) {
      setAccount(storedAccount);
    }
    if (storedIsConnected) {
      setIsConnected(true);
    }
    if (storedIdentity) {
      setIdentity(parse(storedIdentity));
    }
  }, []);

  useEffect(() => {
    if (provider) {
      sessionStorage.setItem(WALLET_PROVIDER_KEY, stringify(provider.provider));
    } else {
      sessionStorage.removeItem(WALLET_PROVIDER_KEY);
    }
  }, [provider]);

  useEffect(() => {
    if (identity) {
      sessionStorage.setItem(SEMAPHORE_IDENTITY_KEY, stringify(identity));
    } else {
      sessionStorage.removeItem(SEMAPHORE_IDENTITY_KEY);
    }
  }, [identity]);

  useEffect(() => {
    if (isConnected) {
      sessionStorage.setItem(WALLET_IS_CONNECTED_KEY, "true");
    } else {
      sessionStorage.removeItem(WALLET_IS_CONNECTED_KEY);
    }
  }, [isConnected]);

  useEffect(() => {
    if (account) {
      sessionStorage.setItem(WALLET_ACCOUNT_KEY, account);
    } else {
      sessionStorage.removeItem(WALLET_ACCOUNT_KEY);
    }
  }, [account]);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setIsConnected(false);
    } else {
      setAccount(accounts[0]);
      setIsConnected(true);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.klaytn) {
        alert("kaia wallet is not installed!");
        return;
      }
      const web3Provider = new w3(window.klaytn);
      // const web3Provider = new ethers.BrowserProvider(window.klaytn);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      web3Provider.on("accountsChanged", handleAccountsChanged);
      setProvider(web3Provider);
      setAccount(accounts[0]);
      setIsConnected(true);

      const result = await liffObject.login();
      if (liffObject.isLoggedIn()) {
        const identity = await createIdentity(
          web3Provider,
          accounts[0],
          liffObject
        );
        setIdentity(identity);
      } else {
        alert("You need to login with LINE if you want to submit the answer");
      }

      // const sdk = await DappPortalSDK.init({
      //   clientId: process.env.NEXT_PUBLIC_DAPP_PORTAL_CLIENT_ID as string,
      //   chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
      // });
      // const provider = sdk.getWalletProvider();
      // const web3Provider = new w3(provider);
      // const accounts = await web3Provider.send("kaia_requestAccounts", []);

      // if (
      //   provider.getWalletType() === WalletType.Liff &&
      //   liffObject.isInClient() &&
      //   liffObject.isLoggedIn()
      // ) {
      //   const identity = await createIdentity(
      //     web3Provider,
      //     accounts[0],
      //     liffObject
      //   );
      //   setIdentity(identity);
      // }

      // setProvider(web3Provider);
      // setAccount(accounts[0]);
      // setIsConnected(true);
    } catch (error) {
      console.log("error", error);
    }
  };

  const disconnectWallet = () => {
    if (confirm("Are you sure you want to disconnect?")) {
      setProvider(null);
      setAccount(null);
      setIsConnected(false);
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        account,
        identity,
        isConnected,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

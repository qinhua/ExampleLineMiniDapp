"use client";

import liff from "@line/liff";
import DappPortalSDK from "@linenext/dapp-portal-sdk";
import React, { createContext, useContext, useEffect, useState } from "react";

interface LiffContextType {
  liffObject: any;
  liffError: any;
  dappPortalSDK: DappPortalSDK | null;
  loading: boolean;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
  const [liffError, setLiffError] = useState(null);
  const [dappPortalSDK, setDappPortalSDK] = useState<DappPortalSDK | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const initDappPortalSDK = async () => {
    const sdk = await DappPortalSDK.init({
      clientId: process.env.NEXT_PUBLIC_DAPP_PORTAL_CLIENT_ID as string,
      chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
    });
    setDappPortalSDK(sdk);
  };

  useEffect(() => {
    // on LINE messenger
    if (liff.isInClient()) {
      liff
        .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID as string })
        .then(() => {
          console.log("liff initialization is done");
          setLiffObject(liff);
          initDappPortalSDK().then(() => {
            console.log("miniDappSDK initialization is done");
            setLoading(false);
          });
        })
        .catch((error: any) => {
          console.log(`liff initialization failed: ${error}`);
          setLiffError(error.toString());
        });
      // on browser
    } else {
      initDappPortalSDK().then(() => {
        console.log("miniDappSDK initialization is done");
        setLoading(false);
      });
    }
  }, []);

  return (
    <LiffContext.Provider
      value={{ liffObject, liffError, dappPortalSDK, loading }}
    >
      {children}
    </LiffContext.Provider>
  );
};

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error("useLiff must be used within a LiffProvider");
  }
  return context;
};

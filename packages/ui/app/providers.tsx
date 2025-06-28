/**
 * @description
 * This client component centralizes all the context providers required for the application,
 * specifically for Solana wallet integration. This follows the best practice of separating
 * client-side-only logic from Server Components like `layout.tsx`.
 *
 * Key features:
 * - `"use client"`: Marks this component and its children as client-side, allowing the use of hooks and event listeners.
 * - `ConnectionProvider`: Sets up and manages the RPC connection to the Solana network.
 * - `WalletProvider`: Manages the state of connected wallets, providing hooks like `useWallet` to the rest of the app.
 * - `WalletModalProvider`: Provides a pre-built, customizable modal for users to select and connect their wallet.
 *
 * @dependencies
 * - `@solana/wallet-adapter-react`: Core providers for wallet state management.
 * - `@solana/wallet-adapter-react-ui`: UI components like the connection modal.
 * - `@solana/wallet-adapter-wallets`: Adapters for specific wallets (e.g., Phantom, Solflare).
 * - `@solana/web3.js`: Used to get the cluster RPC endpoint.
 *
 * @notes
 * The wallet list is memoized with `useMemo` to prevent re-renders.
 * The endpoint is currently set to `devnet`. This can be changed to `mainnet-beta` or a local RPC URL as needed.
 */
"use client";

import React, { FC, useMemo, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
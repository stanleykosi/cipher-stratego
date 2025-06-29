/**
 * @description
 * This client component renders the main header for the Cipher Stratego application.
 * It is responsible for displaying the application's title and providing the wallet
 * connection button.
 *
 * Key features:
 * - `"use client"`: This is a client component because it uses the `WalletMultiButton`,
 *   which relies on client-side hooks and context from the wallet adapter.
 * - Displays the project title "Cipher Stratego".
 * - Integrates the `WalletMultiButton` for a seamless wallet connection experience.
 *
 * @dependencies
 * - `@solana/wallet-adapter-react-ui`: Provides the `WalletMultiButton` component.
 *
 * @notes
 * This component is designed to be used in the root layout to ensure it appears
 * on all pages of the application.
 */
"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

export function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="p-4 flex justify-between items-center border-b border-border">
      <h1 className="text-2xl font-bold text-primary">Cipher Stratego</h1>
      <div>
        {mounted && <WalletMultiButton />}
      </div>
    </header>
  );
}
/**
 * @description
 * This is a client component responsible for handling the creation of a new game.
 * It provides a button that, when clicked, orchestrates the entire process of
 * generating a new game seed, creating the on-chain transaction, sending it to
 * the network, and redirecting the user to the newly created game page.
 *
 * Key features:
 * - `"use client"`: This component must be a client component to use hooks like
 *   `useConnection`, `useWallet`, and `useRouter`.
 * - Handles loading and disabled states to provide clear user feedback.
 * - Generates a cryptographically random 64-bit integer for the game seed.
 * - Interacts with the `solana.ts` helper library to construct the transaction.
 * - Redirects the user to the game page upon successful transaction confirmation.
 * - Displays error messages to the user if the transaction fails.
 *
 * @dependencies
 * - `react`: For `useState`.
 * - `next/navigation`: For the `useRouter` hook for programmatic navigation.
 * - `@solana/wallet-adapter-react`: For `useConnection` and `useWallet` hooks.
 * - `@coral-xyz/anchor`: For `BN` (BigNum) type.
 * - `@/components/ui/button`: The UI component for the button.
 * - `@/lib/solana`: Our helper functions for program interaction.
 * - `lucide-react`: For the loading spinner icon.
 */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProgram, createInitializeGameTx, getGamePda } from "@/lib/solana";

export function CreateGameButton() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (!wallet.connected || !wallet.publicKey || !wallet.sendTransaction) {
      alert("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Get the program instance.
      const program = getProgram(connection, wallet);

      // 2. Generate a random 64-bit number for the game seed.
      const randomSeed = new BigUint64Array(1);
      window.crypto.getRandomValues(randomSeed);
      const gameSeed = new BN(randomSeed[0].toString());

      // 3. Create the initialize_game transaction.
      const tx = await createInitializeGameTx(
        program,
        wallet.publicKey,
        gameSeed
      );

      // 4. Send and confirm the transaction.
      const signature = await wallet.sendTransaction(tx, connection);
      console.log("Transaction signature:", signature);

      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log("Transaction confirmed:", signature);

      // 5. Derive the game PDA address to redirect the user.
      const gamePda = getGamePda(gameSeed);
      router.push(`/game/${gamePda.toBase58()}`);
    } catch (err: any) {
      console.error("Failed to create game:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        size="lg"
        onClick={handleClick}
        disabled={!wallet.connected || loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Creating Game..." : "Create New Game"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
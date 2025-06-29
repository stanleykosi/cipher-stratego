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
      console.log("Step 1: Getting program instance...");
      console.log("Connection RPC endpoint:", connection.rpcEndpoint);
      const program = await getProgram(connection, wallet);
      console.log("Program instance created:", program.programId.toBase58());

      // 2. Generate a random 64-bit number for the game seed.
      console.log("Step 2: Generating random seed...");
      const randomSeed = new BigUint64Array(1);
      window.crypto.getRandomValues(randomSeed);
      const gameSeed = new BN(randomSeed[0].toString());
      console.log("Game seed generated:", gameSeed.toString());

      // 3. Create the initialize_game transaction.
      console.log("Step 3: Creating initialize_game transaction...");
      const tx = await createInitializeGameTx(
        program,
        wallet.publicKey,
        gameSeed
      );
      console.log("Transaction created successfully:", tx);

      // 4. Send and confirm the transaction.
      console.log("Step 4: Sending transaction...");
      console.log("Transaction object:", tx);
      console.log("Wallet connected:", wallet.connected);
      console.log("Wallet publicKey:", wallet.publicKey?.toBase58());
      console.log("Connection endpoint:", connection.rpcEndpoint);

      // Check wallet balance
      if (wallet.publicKey) {
        const balance = await connection.getBalance(wallet.publicKey);
        console.log("Wallet balance:", balance / 1e9, "SOL");
        if (balance < 1000000) { // Less than 0.001 SOL
          throw new Error("Insufficient balance for transaction. Need at least 0.001 SOL for rent and fees.");
        }
      }

      // Simulate transaction first
      console.log("Simulating transaction...");
      try {
        const simulationResult = await connection.simulateTransaction(tx);
        console.log("Simulation result:", simulationResult);

        // Log detailed simulation information
        console.log("Simulation logs:", simulationResult.value.logs);
        console.log("Simulation accounts:", simulationResult.value.accounts);
        console.log("Simulation units consumed:", simulationResult.value.unitsConsumed);

        if (simulationResult.value.err) {
          console.error("Transaction simulation failed:", simulationResult.value.err);
          console.error("Full simulation logs:", simulationResult.value.logs);
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}\nLogs: ${simulationResult.value.logs?.join('\n')}`);
        }
      } catch (simError: unknown) {
        console.error("Transaction simulation error:", simError);
        throw new Error(`Transaction simulation failed: ${simError instanceof Error ? simError.message : String(simError)}`);
      }

      if (!wallet.sendTransaction) {
        throw new Error("Wallet does not support sendTransaction");
      }

      let signature;
      try {
        signature = await wallet.sendTransaction(tx, connection);
        console.log("Transaction signature:", signature);
      } catch (sendError: unknown) {
        console.error("Error during sendTransaction:", sendError);
        console.error("Send error details:", {
          message: sendError instanceof Error ? sendError.message : 'Unknown error',
          name: sendError instanceof Error ? sendError.name : 'Unknown',
          stack: sendError instanceof Error ? sendError.stack : undefined,
          fullError: sendError,
        });

        // Check if it's a network mismatch
        if (sendError instanceof Error && sendError.message.includes('network')) {
          throw new Error("Network mismatch. Make sure your wallet is connected to Devnet.");
        }

        throw sendError;
      }

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
    } catch (err: unknown) {
      console.error("Failed to create game:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code: (err as any)?.code,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: (err as any)?.logs,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        programError: (err as any)?.programError,
        fullError: err,
        errorType: typeof err,
        errorConstructor: err instanceof Error ? err.constructor?.name : 'Unknown',
      });

      // Handle user rejection more gracefully
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage?.includes("User rejected") || errorMessage?.includes("rejected the request")) {
        setError("Transaction cancelled by user.");
      } else if (errorMessage?.includes("Unexpected error")) {
        setError(`Transaction failed: ${errorMessage}. Check console for details.`);
      } else {
        setError(errorMessage || "An unknown error occurred.");
      }
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
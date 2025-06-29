"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "@/lib/solana";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Types from IDL (limited to what we need)
interface GameAccount {
  players: PublicKey[];
  turnNumber: bigint;
  gameSeed: bigint;
  gameState: {
    awaitingPlayer?: {};
    p1Turn?: {};
    p2Turn?: {};
    p1Won?: {};
    p2Won?: {};
    draw?: {};
  };
}

/**
 * GamePage
 * -------------------------------------------
 * A simple client page that fetches the on-chain `Game` account using the PDA
 * from the URL ( `/game/[gameId]` ) and displays basic information such as the
 * players, game seed, and current state.  This unblocks navigation after a
 * game is created – until full game-board UI is implemented.
 */
export default function GamePage() {
  const params = useParams();
  const { connection } = useConnection();
  const gameId = Array.isArray(params?.gameId) ? params.gameId[0] : params?.gameId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<any | null>(null);

  const GAME_STATE_NAMES = [
    "Awaiting Player",
    "P1 Turn",
    "P2 Turn",
    "P1 Won",
    "P2 Won",
    "Draw",
  ];

  useEffect(() => {
    if (!gameId) return;

    const fetchGame = async () => {
      try {
        setLoading(true);
        setError(null);

        // For a read-only query we can stub the wallet
        const dummyWallet = {
          publicKey: null,
          connected: false,
          signTransaction: undefined,
          signAllTransactions: undefined,
        } as unknown as Parameters<typeof getProgram>[1];

        const program = await getProgram(connection, dummyWallet);
        const account = await program.account.game.fetch(new PublicKey(gameId));
        setGame(account);
      } catch (err) {
        console.error("Failed to fetch game:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [connection, gameId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="mt-2 text-sm">Loading game…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-10">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        Game account not found on chain.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <h1 className="text-2xl font-bold">Cipher Stratego – Game</h1>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">General</h2>
        <p className="break-all"><span className="font-medium">PDA:</span> {gameId}</p>
        <p><span className="font-medium">Seed:</span> {game.gameSeed.toString()}</p>
        <p><span className="font-medium">Turn #:</span> {game.turnNumber.toString()}</p>
        <p><span className="font-medium">State:</span> {GAME_STATE_NAMES[game.gameState] ?? "Unknown"}</p>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Players</h2>
        <p className="break-all"><span className="font-medium">Player 1:</span> {game.players[0].toBase58?.() ?? game.players[0]}</p>
        <p className="break-all"><span className="font-medium">Player 2:</span> {game.players[1].toBase58?.() ?? game.players[1]}</p>
      </section>

      <section className="rounded-lg border p-4 text-muted-foreground">
        Full gameplay UI coming soon…
      </section>
    </div>
  );
} 
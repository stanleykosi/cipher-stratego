/**
 * @description
 * This client component is the main interactive interface for a single game.
 * It receives the initial game state from its parent server component and manages
 * all subsequent UI updates and user actions.
 *
 * I have updated this component to:
 * 1.  Integrate the new `ShipPlacementPanel`.
 * 2.  Determine the user's role and whether they have submitted their board.
 * 3.  Conditionally render the `ShipPlacementPanel` when a player needs to set up
 *     their board.
 * 4.  Show a "Waiting for opponent" message if the player has submitted but the
 *     opponent has not.
 * 5.  Add a placeholder for the `handlePlacementComplete` function, which will
 *     be fully implemented in the next step to handle board encryption and
 *     transaction submission.
 *
 * @dependencies
 * - All previous dependencies, plus:
 * - `@/types`: For the new shared types.
 * - `@/app/game/[gameId]/_components/ship-placement-panel`: The new component for board setup.
 */
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

import { getProgram, createJoinGameTx, createSubmitBoardTx } from '@/lib/solana';
import { encryptBoard, hexToUint8Array } from '@/lib/arcium';
import { type ClientGameState, type RawBoard } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, Check } from 'lucide-react';
import { ShipPlacementPanel } from './ship-placement-panel';

interface GameClientProps {
  initialGameState: ClientGameState;
  gameId: string;
}

export default function GameClient({ initialGameState, gameId }: GameClientProps) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [gameState, setGameState] = useState<ClientGameState>(() => ({
    ...initialGameState,
    gameState: initialGameState.gameState,
    boardsSubmitted: initialGameState.boardsSubmitted || [false, false],
  }));

  const [loading, setLoading] = useState(false);
  const [isSubmittingBoard, setIsSubmittingBoard] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const userRole = useMemo(() => {
    if (!wallet.publicKey) return 'spectator';
    const userPubkey = wallet.publicKey.toBase58();
    if (userPubkey === gameState.players[0]) return 'p1';
    if (userPubkey === gameState.players[1]) return 'p2';
    return 'spectator';
  }, [wallet.publicKey, gameState.players]);

  const hasSubmitted = useMemo(() => {
    if (!gameState.boardsSubmitted || userRole === 'spectator') return false;
    const playerIndex = userRole === 'p1' ? 0 : 1;
    return gameState.boardsSubmitted[playerIndex];
  }, [userRole, gameState.boardsSubmitted]);

  const bothHaveSubmitted = useMemo(() => {
    return gameState.boardsSubmitted?.[0] && gameState.boardsSubmitted?.[1];
  }, [gameState.boardsSubmitted]);

  const refreshGameState = useCallback(async () => {
    console.log("Refreshing game state...");
    try {
      const program = await getProgram(connection, wallet);
      const freshState = await program.account.game.fetch(new PublicKey(gameId));

      console.log("Fresh state game state:", freshState.gameState, typeof freshState.gameState);

      let parsedGameState: ClientGameState['gameState'];
      if (typeof freshState.gameState === 'object' && freshState.gameState !== null) {
        // Old format: { awaitingPlayer: {} } - convert to new format
        const oldKey = Object.keys(freshState.gameState)[0];
        console.log("Old object format key in refresh:", oldKey);

        // Map old keys to new format
        const oldToNewMapping: Record<string, ClientGameState['gameState']> = {
          'awaitingPlayer': 'AwaitingPlayer',
          'boardSetup': 'BoardSetup',
          'p1Turn': 'P1Turn',
          'p2Turn': 'P2Turn',
          'p1Won': 'P1Won',
          'p2Won': 'P2Won'
        };

        parsedGameState = oldToNewMapping[oldKey] || oldKey as ClientGameState['gameState'];
        console.log("Mapped to new format in refresh:", parsedGameState);
      } else {
        // New format: numeric enum
        const gameStateMapping: ClientGameState['gameState'][] = ['AwaitingPlayer', 'BoardSetup', 'P1Turn', 'P2Turn', 'P1Won', 'P2Won'];
        parsedGameState = gameStateMapping[freshState.gameState as number];
        console.log("Numeric format mapped in refresh:", parsedGameState);
      }

      setGameState({
        players: freshState.players.map(p => p.toBase58()),
        turnNumber: freshState.turnNumber.toString(),
        gameSeed: freshState.gameSeed.toString(),
        gameState: parsedGameState,
        boardsSubmitted: freshState.boardsSubmitted,
      });
    } catch (e) {
      console.error("Failed to refresh game state:", e);
      setError("Could not refresh game state. Please refresh the page.");
    }
  }, [connection, wallet, gameId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const shouldPoll = gameState.gameState === 'AwaitingPlayer' ||
      (gameState.gameState === 'BoardSetup' && !bothHaveSubmitted);

    if (shouldPoll && wallet.connected) {
      intervalId = setInterval(refreshGameState, 5000); // Poll every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameState.gameState, bothHaveSubmitted, wallet.connected, refreshGameState]);

  const handleJoinGame = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your wallet to join the game.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const program = await getProgram(connection, wallet);
      const gameAccount = {
        publicKey: new PublicKey(gameId),
        account: {
          gameSeed: new BN(gameState.gameSeed)
        }
      };

      const tx = await createJoinGameTx(program, wallet.publicKey, gameAccount);

      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      await refreshGameState();

    } catch (err: unknown) {
      setError((err as Error)?.message || 'An unknown error occurred while joining the game.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlacementComplete = async (board: RawBoard) => {
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your wallet to submit your board.");
      return;
    }
    setIsSubmittingBoard(true);
    setError('');

    try {
      // 1. Get Arcium cluster public key from environment variables
      const clusterPublicKeyHex = process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_PUBKEY;
      if (!clusterPublicKeyHex) {
        throw new Error("Arcium cluster public key is not configured. Please set NEXT_PUBLIC_ARCIUM_CLUSTER_PUBKEY.");
      }
      const clusterPublicKey = hexToUint8Array(clusterPublicKeyHex);

      // 2. Encrypt the board layout client-side
      console.log("Encrypting board...");
      const encryptedPayload = await encryptBoard(board, clusterPublicKey);

      // 3. Get the program and construct the transaction
      const program = await getProgram(connection, wallet);
      const gamePda = new PublicKey(gameId);
      console.log("Constructing submit_board transaction...");
      const tx = await createSubmitBoardTx(program, wallet.publicKey, gamePda, encryptedPayload);

      // 4. Send and confirm the transaction
      console.log("Sending transaction to commit board...");
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log("Board submitted successfully. Transaction:", signature);

      // 5. Refresh the game state to reflect the submission
      await refreshGameState();

    } catch (err: unknown) {
      console.error("Failed to submit board:", err);
      setError((err as Error)?.message || 'An unknown error occurred during board submission.');
    } finally {
      setIsSubmittingBoard(false);
    }
  };

  const handleCopyGameLink = async () => {
    const gameUrl = `${window.location.origin}/game/${gameId}`;
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderWaitingForOpponent = () => (
    <Card className="w-full max-w-md text-center">
      <CardHeader><CardTitle>Waiting for Opponent</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p>Share this link with your opponent:</p>
        <div className="flex gap-2">
          <Input id="game-link-input" value={`${window.location.origin}/game/${gameId}`} readOnly />
          <Button variant="outline" size="icon" onClick={handleCopyGameLink} className="shrink-0">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (gameState.gameState === 'AwaitingPlayer') {
      return userRole === 'p1' ? renderWaitingForOpponent() : (
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Join Game</CardTitle>
            <CardDescription>You have been invited to a game of Cipher Stratego!</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleJoinGame} disabled={loading || !wallet.connected}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Joining...</> : 'Join Game'}
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (gameState.gameState === 'BoardSetup') {
      if (hasSubmitted) {
        return (
          <Card className="w-full max-w-md text-center">
            <CardHeader><CardTitle>Board Submitted</CardTitle></CardHeader>
            <CardContent>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4">Your board has been committed. Waiting for your opponent...</p>
            </CardContent>
          </Card>
        );
      }
      return <ShipPlacementPanel onPlacementComplete={handlePlacementComplete} isSubmitting={isSubmittingBoard} />;
    }

    if (gameState.gameState === 'P1Turn' || gameState.gameState === 'P2Turn') {
      return <p>Active Gameplay (UI coming in a future step)</p>;
    }

    if (gameState.gameState === 'P1Won' || gameState.gameState === 'P2Won') {
      return <p>Game Over (UI coming soon)</p>;
    }

    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader><CardTitle className="text-destructive">Unknown Game State</CardTitle></CardHeader>
        <CardContent>
          <p>Game state: {gameState.gameState}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-grow flex-col items-center justify-center p-4">
      {renderContent()}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
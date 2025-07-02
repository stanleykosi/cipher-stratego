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

import { getProgram, createJoinGameTx } from '@/lib/solana';
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
    // The gameState is already parsed in the server component
    gameState: initialGameState.gameState,
    boardsSubmitted: initialGameState.boardsSubmitted || [false, false],
  }));

  const [loading, setLoading] = useState(false);
  const [isSubmittingBoard, setIsSubmittingBoard] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Determine the user's role (p1, p2, or spectator) based on their wallet address.
  const userRole = useMemo(() => {
    if (!wallet.publicKey) return 'spectator';
    const userPubkey = wallet.publicKey.toBase58();
    if (userPubkey === gameState.players[0]) return 'p1';
    if (userPubkey === gameState.players[1]) return 'p2';
    return 'spectator';
  }, [wallet.publicKey, gameState.players]);

  // Determine if the current user has already submitted their board.
  const hasSubmitted = useMemo(() => {
    if (!gameState.boardsSubmitted) return false;
    if (userRole === 'p1') return gameState.boardsSubmitted[0];
    if (userRole === 'p2') return gameState.boardsSubmitted[1];
    return false;
  }, [userRole, gameState.boardsSubmitted]);

  // Determine if the opponent has submitted their board.
  const opponentHasSubmitted = useMemo(() => {
    if (!gameState.boardsSubmitted) return false;
    if (userRole === 'p1') return gameState.boardsSubmitted[1];
    if (userRole === 'p2') return gameState.boardsSubmitted[0];
    return false;
  }, [userRole, gameState.boardsSubmitted]);

  const refreshGameState = useCallback(async () => {
    console.log("Refreshing game state...");
    try {
      const program = await getProgram(connection, wallet);
      const freshState = await program.account.game.fetch(new PublicKey(gameId));
      console.log("Fetched fresh state:", freshState);
      console.log("Raw gameState:", freshState.gameState);
      console.log("GameState type:", typeof freshState.gameState);

      // Handle both enum object format and numeric format
      let parsedGameState: ClientGameState['gameState'];
      if (typeof freshState.gameState === 'object' && freshState.gameState !== null) {
        // Old format: { awaitingPlayer: {} }
        parsedGameState = Object.keys(freshState.gameState)[0] as ClientGameState['gameState'];
      } else {
        // New format: numeric enum
        const gameStateMapping = ['awaitingPlayer', 'p1Turn', 'p2Turn', 'p1Won', 'p2Won'];
        parsedGameState = gameStateMapping[freshState.gameState as number] as ClientGameState['gameState'];
      }
      console.log("Parsed gameState:", parsedGameState);

      setGameState({
        ...freshState,
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

  // Poll for game state changes when waiting for players or boards
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Only poll when we're waiting for something
    const shouldPoll = gameState.gameState === 'awaitingPlayer' ||
      (gameState.gameState === 'p1Turn' || gameState.gameState === 'p2Turn') &&
      (hasSubmitted && !opponentHasSubmitted);

    if (shouldPoll && wallet.connected) {
      intervalId = setInterval(() => {
        refreshGameState();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [gameState.gameState, hasSubmitted, opponentHasSubmitted, wallet.connected, refreshGameState]);

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

      console.log('Successfully joined game, transaction:', signature);
      await refreshGameState();

    } catch (err: unknown) {
      console.error("Failed to join game:", err);
      setError((err as Error)?.message || 'An unknown error occurred while joining the game.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlacementComplete = async (board: RawBoard) => {
    setIsSubmittingBoard(true);
    setError('');
    console.log("Board placement complete. Final layout:", board);
    // TODO: In Step 12, this function will:
    // 1. Get the Arcium cluster public key.
    // 2. Call `encryptBoard` from `lib/arcium.ts`.
    // 3. Call `createSubmitBoardTx` from `lib/solana.ts`.
    // 4. Send and confirm the transaction.
    // 5. Handle success and error states.
    // For now, we simulate a delay.
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Simulating board submission... (actual logic in next step)");
    // This is where we would call `refreshGameState()` after a real submission.
    setIsSubmittingBoard(false);
    alert("Board submission logic is not yet implemented. Check the console for your board layout.");
  };

  const handleCopyGameLink = async () => {
    const gameUrl = `${window.location.origin}/game/${gameId}`;
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy game link:', err);
      const input = document.getElementById('game-link-input') as HTMLInputElement;
      if (input) input.select();
    }
  };

  const renderWaitingForOpponent = () => (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle>Waiting for Opponent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p>Share this link with your opponent:</p>
          <div className="flex gap-2">
            <Input
              id="game-link-input"
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${gameId}`}
              readOnly
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleCopyGameLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {copied ? 'Link copied to clipboard!' : 'Your opponent will use this link to join the game.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (gameState.gameState) {
      case 'awaitingPlayer':
        if (userRole === 'p1') {
          return renderWaitingForOpponent();
        }
        if (userRole === 'spectator') {
          return (
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
        return <p>Waiting for Player 2 to join...</p>;

      case 'p1Turn':
      case 'p2Turn':
        // Board submission phase logic
        if (!hasSubmitted) {
          return <ShipPlacementPanel onPlacementComplete={handlePlacementComplete} isSubmitting={isSubmittingBoard} />;
        }
        if (!opponentHasSubmitted) {
          return <Card className="w-full max-w-md text-center">
            <CardHeader><CardTitle>Board Submitted</CardTitle></CardHeader>
            <CardContent>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4">Your board has been committed. Waiting for opponent to submit their board.</p>
            </CardContent>
          </Card>
        }
        // If both have submitted, move to active gameplay
        return <p>Active Gameplay (UI coming in a future step)</p>;

      case 'p1Won':
      case 'p2Won':
        return <p>Game Over (UI coming soon)</p>;

      default:
        return (
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-destructive">Unknown Game State</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Game state: {JSON.stringify(gameState.gameState)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Please refresh the page or check the console for more details.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex flex-grow flex-col items-center justify-center p-4">
      {renderContent()}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
/**
 * @description
 * This client component is the main interactive interface for a single game.
 * It receives the initial game state from its parent server component and manages
 * all subsequent UI updates and user actions.
 *
 * Key features:
 * - `"use client"`: Enables the use of client-side hooks like `useState`, `useEffect`,
 *   and `useWallet`.
 * - Manages the game's state, including loading and error states for actions.
 * - Determines the current user's role (Player 1, Player 2, or Spectator).
 * - Renders different UI views based on the current `gameState`:
 *   - "Waiting for opponent" message for Player 1.
 *   - "Join Game" button for a prospective Player 2.
 *   - Placeholder for the upcoming "Board Submission" phase.
 * - Handles the `joinGame` transaction flow, providing user feedback throughout.
 *
 * @dependencies
 * - `react`: For state and effect management.
 * - `@solana/wallet-adapter-react`: For wallet context.
 * - `@/lib/solana`: For program interaction helpers.
 * - `lucide-react`: For icons.
 * - Shadcn UI components: For building the interface.
 */
"use client";

import { useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

import { getProgram, createJoinGameTx } from '@/lib/solana';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Local alias for on-chain GameState enum variants
type GameStateEnum = 'awaitingPlayer' | 'p1Turn' | 'p2Turn' | 'p1Won' | 'p2Won' | 'draw';

// Define a client-side friendly version of the game state
interface ClientGameState {
  players: string[];
  turnNumber: string;
  gameSeed: string;
  gameState: GameStateEnum;
  boardsSubmitted: boolean[];
}

interface GameClientProps {
  initialGameState: ClientGameState; // Serialized game state from server
  gameId: string;
}

export default function GameClient({ initialGameState, gameId }: GameClientProps) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [gameState, setGameState] = useState<ClientGameState>(() => ({
    ...initialGameState,
    gameState: Object.keys(initialGameState.gameState)[0] as GameStateEnum,
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userRole = useMemo(() => {
    if (!wallet.publicKey) return 'spectator';
    const userPubkey = wallet.publicKey.toBase58();
    if (userPubkey === gameState.players[0]) return 'p1';
    if (userPubkey === gameState.players[1]) return 'p2';
    return 'spectator';
  }, [wallet.publicKey, gameState.players]);

  const refreshGameState = async () => {
    try {
      const program = await getProgram(connection, wallet);
      const freshState = await program.account.game.fetch(new PublicKey(gameId));
      setGameState({
        ...freshState,
        players: freshState.players.map(p => p.toBase58()),
        turnNumber: freshState.turnNumber.toString(),
        gameSeed: freshState.gameSeed.toString(),
        gameState: Object.keys(freshState.gameState)[0] as GameStateEnum,
      });
    } catch (e) {
      console.error("Failed to refresh game state:", e);
      setError("Could not refresh game state. Please refresh the page.");
    }
  }

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
      // Refresh the game state to reflect the new player
      await refreshGameState();

    } catch (err: unknown) {
      console.error("Failed to join game:", err);
      setError((err as Error)?.message || 'An unknown error occurred while joining the game.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (gameState.gameState) {
      case 'awaitingPlayer':
        return (
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>Waiting for Opponent</CardTitle>
            </CardHeader>
            <CardContent>
              {userRole === 'p1' && (
                <div>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-4">Share the game link with your opponent.</p>
                  <p className="mt-2 text-sm text-muted-foreground">They will be able to join using this page.</p>
                </div>
              )}
              {userRole === 'spectator' && (
                <div>
                  <p className="mb-4">You have been invited to a game of Cipher Stratego!</p>
                  <Button onClick={handleJoinGame} disabled={loading || !wallet.connected}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Joining...' : 'Join Game'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'p1Turn':
      case 'p2Turn':
        // TODO: Implement Board Submission UI in Step 11
        if (!gameState.boardsSubmitted[0] || !gameState.boardsSubmitted[1]) {
          return (
            <Card className="w-full max-w-lg text-center">
              <CardHeader><CardTitle>Game Setup</CardTitle><CardDescription>Both players must place their ships and submit their boards.</CardDescription></CardHeader>
              <CardContent>
                <p className="text-lg">Board Submission Phase</p>
                <p className="mt-4 text-muted-foreground">(UI coming in next step)</p>
              </CardContent>
            </Card>
          )
        }
        // TODO: Implement Active Gameplay UI in later steps
        return <p>Active Gameplay (UI coming soon)</p>;

      case 'p1Won':
      case 'p2Won':
        return <p>Game Over (UI coming soon)</p>;

      default:
        return <p>Unknown game state: {gameState.gameState}</p>;
    }
  };

  return (
    <div className="flex flex-grow flex-col items-center justify-center p-4">
      {renderContent()}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
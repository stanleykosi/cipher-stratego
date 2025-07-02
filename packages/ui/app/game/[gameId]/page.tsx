/**
 * @description
 * This is the server component for the game page, responsible for fetching the
 * initial state of a specific game from the Solana blockchain.
 *
 * I have refactored this file to:
 * 1.  Function as a Next.js Server Component, which is best practice for data fetching.
 * 2.  It fetches the game account data using the `gameId` from the URL parameters.
 * 3.  If the game is found, it passes the initial game state and the game's public
 *     key to the new `GameClient` component for interactive rendering.
 * 4.  It handles cases where the game is not found or an error occurs during fetching,
 *     providing clear feedback to the user.
 *
 * @dependencies
 * - `next/navigation`: To get URL parameters.
 * - `@solana/web3.js`: For `PublicKey` and `Connection`.
 * - `@/lib/solana`: For the `getProgram` helper.
 * - `@/app/game/[gameId]/_components/game-client`: The client component that will render the game UI.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { notFound } from "next/navigation";
import GameClientWrapper from "@/app/game/[gameId]/_components/game-client-wrapper";
import { getProgram } from "@/lib/solana";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ClientGameState } from "@/types";

// Revalidate the page on every request to get the latest game state
export const revalidate = 0;

interface GamePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  let gamePda: PublicKey;

  try {
    gamePda = new PublicKey(gameId);
  } catch {
    console.error("Invalid Game ID (not a valid public key):", gameId);
    notFound();
  }

  // Use a server-side connection. For production, use an environment variable.
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_HOST || "https://api.devnet.solana.com",
    "confirmed"
  );

  // For server-side fetching, we don't have a user's wallet.
  // We can create a "dummy" wallet object that AnchorProvider can use for read-only operations.
  const dummyWallet = {
    publicKey: PublicKey.unique(), // A throwaway public key
    signTransaction: () => Promise.reject(new Error("Dummy wallet cannot sign")),
    signAllTransactions: () => Promise.reject(new Error("Dummy wallet cannot sign")),
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, dummyWallet as any, AnchorProvider.defaultOptions());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = await getProgram(connection, provider.wallet as any);

    // Fetch the game account data
    const game = await program.account.game.fetch(gamePda);

    // Handle both enum object format and numeric format
    let parsedGameState: ClientGameState['gameState'];
    console.log("Raw game state from blockchain:", game.gameState, typeof game.gameState);

    if (typeof game.gameState === 'object' && game.gameState !== null) {
      // Old format: { awaitingPlayer: {} } - convert to new format
      const oldKey = Object.keys(game.gameState)[0];
      console.log("Old object format key:", oldKey);

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
      console.log("Mapped to new format:", parsedGameState);
    } else {
      // New format: numeric enum - using exact IDL casing
      const gameStateMapping = ['AwaitingPlayer', 'BoardSetup', 'P1Turn', 'P2Turn', 'P1Won', 'P2Won'];
      parsedGameState = gameStateMapping[game.gameState as number] as ClientGameState['gameState'];
      console.log("Numeric format mapped to:", parsedGameState);
    }

    // The fetched data needs to be serialized to be passed from Server to Client Component
    const initialGameState = {
      players: game.players.map(p => p.toBase58()),
      turnNumber: game.turnNumber.toString(),
      gameSeed: game.gameSeed.toString(),
      gameState: parsedGameState,
      boardsSubmitted: game.boardsSubmitted || [false, false],
    }

    return <GameClientWrapper initialGameState={initialGameState} gameId={gameId} />;
  } catch (error) {
    console.error(`Failed to fetch game account ${gameId}:`, error);
    // This could be a 404 if the account doesn't exist, or another error.
    // We'll show a user-friendly message.
    return (
      <div className="flex h-full min-h-[calc(100vh-150px)] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Game</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not find or load the game with ID:</p>
            <p className="mt-2 break-all font-mono text-sm text-muted-foreground">{gameId}</p>
            <p className="mt-4">Please check the link and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
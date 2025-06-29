/**
 * @description
 * This is the home page of the Cipher Stratego application. It serves as the main
 * entry point and lobby for players.
 *
 * I have updated this page to:
 * - Replace the placeholder "Create New Game" button with the new, functional
 *   `CreateGameButton` client component. This delegates the complex client-side
-    *   logic of wallet interaction and transaction signing to a dedicated component,
 *   keeping the home page clean and adhering to React best practices.
 *
 * @dependencies
 * - `@/components/ui/card`: To structure the content.
 * - `@/app/_components/create-game-button`: The new client component for game creation.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateGameButton } from "@/app/_components/create-game-button";

export default function Home() {
  return (
    <div className="flex flex-grow items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Welcome to Cipher Stratego</CardTitle>
          <CardDescription>
            A fully on-chain hidden information game powered by Arcium and
            Solana.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <p>Connect your wallet and start a new game to begin.</p>
            <CreateGameButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
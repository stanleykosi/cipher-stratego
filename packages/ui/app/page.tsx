/**
 * @description
 * This is the home page of the Cipher Stratego application. It serves as the main
 * entry point and lobby for players.
 *
 * I have updated this page to:
 * - Remove the default Next.js boilerplate content.
 * - Create a clean, centered layout for the main call to action.
 * - Prepare the space for the "Create New Game" button, which will be added
 *   in a future step.
 *
 * @dependencies
 * - `@/components/ui/button`: The custom Button component (placeholder for now).
 * - `@/components/ui/card`: To structure the content.
 *
 * @notes
 * The actual button functionality will be implemented in a dedicated client component
 * in a later step to handle wallet interactions and on-chain transactions.
 */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
            {/* The functionality for this button will be implemented in Step 9 */}
            <Button disabled size="lg">
              Create New Game (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
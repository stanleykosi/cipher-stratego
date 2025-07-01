/**
 * @description
 * This component provides a loading state for the game page (`/game/[gameId]`).
 * It is automatically rendered by Next.js's App Router when the `page.tsx`
 * Server Component is fetching data.
 *
 * Key features:
 * - Displays a full-page loading indicator with a spinner and text.
 * - Improves user experience by providing immediate feedback that content is being loaded.
 *
 * @dependencies
 * - `lucide-react`: For the `Loader2` spinner icon.
 */
import { Loader2 } from "lucide-react";

export default function GameLoading() {
  return (
    <div className="flex h-full min-h-[calc(100vh-150px)] w-full flex-col items-center justify-center space-y-4 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p>Loading Game...</p>
    </div>
  );
}
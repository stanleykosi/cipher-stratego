"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ClientGameState } from "@/types";

// Dynamically import GameClient with SSR disabled to avoid Arcium SSR issues
const GameClient = dynamic(() => import("@/app/game/[gameId]/_components/game-client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[calc(100vh-150px)] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Loading Game...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading game interface...</div>
        </CardContent>
      </Card>
    </div>
  ),
});

interface GameClientWrapperProps {
  initialGameState: ClientGameState;
  gameId: string;
}

export default function GameClientWrapper({ initialGameState, gameId }: GameClientWrapperProps) {
  return <GameClient initialGameState={initialGameState} gameId={gameId} />;
} 
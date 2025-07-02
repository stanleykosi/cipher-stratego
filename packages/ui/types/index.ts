/**
 * @description
 * This file defines shared TypeScript types and interfaces used across the
 * Cipher Stratego frontend application. This ensures type consistency and
 * improves code readability and maintainability.
 *
 * Key types:
 * - `GameStateEnum`, `HitOrMiss`: Client-side mirrors of the on-chain enums.
 * - `ClientGameState`: A serializable representation of the on-chain `Game` account.
 * - `Ship`: Defines the structure for a ship object, including placement status.
 * - `CellState`: A union type representing all possible states of a single grid cell,
 *   used for rendering the `GameBoard` component.
 * - `Board`, `RawBoard`: Type aliases for the visual board state and the numeric
 *   representation used for on-chain submission, respectively.
 */

// On-chain program enums, mirrored on the client for type safety.
export type GameStateEnum = 'awaitingPlayer' | 'p1Turn' | 'p2Turn' | 'p1Won' | 'p2Won';
export type HitOrMiss = 'miss' | 'hit';

/**
 * A client-side, serializable representation of the on-chain `Game` account state.
 * PublicKeys and BigNumbers are converted to strings to be easily passed from
 * Server Components to Client Components.
 */
export interface ClientGameState {
  players: string[];
  turnNumber: string;
  gameSeed: string;
  gameState: GameStateEnum;
  boardsSubmitted: boolean[];
  // The full game log can be added here as the feature is implemented.
  // gameLog: Shot[];
}

/**
 * Represents a single ship in a player's fleet, used during the placement phase.
 */
export interface Ship {
  name: string;
  length: number;
  placed: boolean;
}

/**
 * Represents all possible visual states of a single cell on the game board.
 * This is used by the `GameBoard` component to determine how to style each cell.
 */
export type CellState =
  | "empty"       // Water, no action taken yet (on player's own board)
  | "ship"        // A cell occupied by one of the player's own ships
  | "hit"         // A successful hit on a ship
  | "miss"        // A shot fired that missed
  | "preview"     // A valid preview of a ship placement
  | "invalid"     // An invalid preview of a ship placement (e.g., out of bounds, overlap)
  | "water";      // A cell on the opponent's board where no shot has been fired

/**
 * Represents the entire visual state of the game board.
 */
export type Board = CellState[][];

/**
 * The raw numeric representation of the board, where 1 is a ship and 0 is water.
 * This is the format required for encryption and submission to the Solana program.
 */
export type RawBoard = number[][];
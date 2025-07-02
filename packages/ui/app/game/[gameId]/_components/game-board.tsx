/**
 * @description
 * This component is responsible for rendering the 8x8 game grid. It's a highly
 * reusable and stateless component that displays different cell states based on
 * the `board` prop it receives.
 *
 * Key features:
 * - `"use client"`: Required for using event handlers like `onClick` and `onMouseOver`.
 * - Renders an NxN grid using CSS Grid layout.
 * - Dynamically styles each cell based on its `CellState` (e.g., 'ship', 'hit', 'miss').
 * - Supports interactivity through `onCellClick`, `onCellEnter`, and `onCellLeave`
 *   props, making it suitable for both displaying state and capturing user input.
 * - Can be disabled to prevent user interaction.
 *
 * @dependencies
 * - `react`: For component creation.
 * - `@/lib/utils`: For the `cn` utility to conditionally apply CSS classes.
 * - `@/types`: For the `Board` and `CellState` types.
 */
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Board, CellState } from '@/types';

interface GameBoardProps {
  // The 2D array representing the visual state of the board.
  board: Board;
  // A flag to disable all interactions with the board.
  disabled?: boolean;
  // Optional callback for when a cell is clicked.
  onCellClick?: (row: number, col: number) => void;
  // Optional callback for when the mouse enters a cell.
  onCellEnter?: (row: number, col: number) => void;
  // Optional callback for when the mouse leaves the grid area.
  onGridLeave?: () => void;
}

// A mapping from CellState to its corresponding CSS classes for styling.
const cellStateClasses: Record<CellState, string> = {
  empty: "bg-background",
  water: "bg-blue-900/50",
  ship: "bg-slate-500",
  hit: "bg-rose-700",
  miss: "bg-slate-700",
  preview: "bg-green-600/70",
  invalid: "bg-red-600/70",
};

export function GameBoard({
  board,
  disabled = false,
  onCellClick,
  onCellEnter,
  onGridLeave,
}: GameBoardProps) {
  const handleCellClick = (row: number, col: number) => {
    if (!disabled && onCellClick) {
      onCellClick(row, col);
    }
  };

  const handleCellEnter = (row: number, col: number) => {
    if (!disabled && onCellEnter) {
      onCellEnter(row, col);
    }
  };

  return (
    <div
      className="grid aspect-square w-full max-w-[500px] gap-1 p-2 rounded-md bg-border"
      style={{ gridTemplateColumns: `repeat(${board.length}, 1fr)` }}
      onMouseLeave={onGridLeave}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={cn(
              "aspect-square w-full rounded-sm transition-colors",
              cellStateClasses[cell],
              { "cursor-pointer hover:bg-slate-400": !disabled && onCellClick },
              { "cursor-not-allowed": disabled }
            )}
            onClick={() => handleCellClick(rowIndex, colIndex)}
            onMouseEnter={() => handleCellEnter(rowIndex, colIndex)}
          />
        ))
      )}
    </div>
  );
}
/**
 * @description
 * This component manages the entire ship placement phase for a player. It's a
 * stateful client component that handles ship selection, rotation, placement
 * validation, and final submission.
 *
 * Key features:
 * - `"use client"`: Enables extensive use of `useState` and `useCallback` for
 *   managing the complex placement logic.
 * - Manages the state of the board, the fleet of ships, selection, and orientation.
 * - Provides a visual list of ships to be placed.
 * - Includes controls for rotating the selected ship and resetting the board.
 * - Implements real-time placement validation to prevent ships from being placed
 *   out of bounds or overlapping with each other.
 * - Uses the `GameBoard` component to render the board with interactive previews.
 * - Enables a "Lock In & Submit Board" button only when all ships are validly placed.
 *
 * @dependencies
 * - `react`: For state and callback hooks.
 * - `@/lib/constants`: For `GRID_SIZE` and `SHIP_CONFIG`.
 * - `@/types`: For shared types like `Ship`, `RawBoard`, and `Board`.
 * - `@/components/ui`: For `Button` and `Card` components.
 * - `lucide-react`: For icons.
 * - `./game-board`: The component for rendering the grid.
 */
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { GameBoard } from "./game-board";
import { GRID_SIZE, SHIP_CONFIG } from "@/lib/constants";
import { type Ship, type RawBoard, type Board } from "@/types";
import { Button } from "@/components/ui/button";
import { RotateCw, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ShipPlacementPanelProps {
  onPlacementComplete: (board: RawBoard) => void;
  isSubmitting: boolean;
}

export function ShipPlacementPanel({ onPlacementComplete, isSubmitting }: ShipPlacementPanelProps) {
  // The raw numeric board state (0 for water, 1 for ship)
  const [board, setBoard] = useState<RawBoard>(
    () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );

  // The fleet of ships, tracking their placed status
  const [ships, setShips] = useState<Ship[]>(
    () => SHIP_CONFIG.map(ship => ({ ...ship, placed: false }))
  );

  // The index of the currently selected ship from the `ships` array
  const [selectedShipIndex, setSelectedShipIndex] = useState<number | null>(0);
  
  // The orientation for placing the selected ship
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  
  // The coordinates of the cell the mouse is currently hovering over
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Derived state: true if all ships have been placed on the board
  const allShipsPlaced = useMemo(() => ships.every(ship => ship.placed), [ships]);

  /**
   * Checks if a potential ship placement is valid (within bounds and not overlapping).
   */
  const checkPlacement = useCallback((shipLength: number, row: number, col: number, currentOrientation: 'horizontal' | 'vertical') => {
    if (currentOrientation === 'horizontal') {
      if (col + shipLength > GRID_SIZE) return false;
      for (let i = 0; i < shipLength; i++) {
        if (board[row][col + i] === 1) return false;
      }
    } else {
      if (row + shipLength > GRID_SIZE) return false;
      for (let i = 0; i < shipLength; i++) {
        if (board[row + i][col] === 1) return false;
      }
    }
    return true;
  }, [board]);

  /**
   * Toggles the orientation of the selected ship.
   */
  const handleRotate = () => {
    setOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  /**
   * Resets the board and the placement status of all ships.
   */
  const handleReset = useCallback(() => {
    setBoard(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)));
    setShips(SHIP_CONFIG.map(ship => ({ ...ship, placed: false })));
    setSelectedShipIndex(0);
  }, []);

  /**
   * Handles clicking a cell on the board to place the selected ship.
   */
  const handleCellClick = (row: number, col: number) => {
    if (selectedShipIndex === null) return;
    const ship = ships[selectedShipIndex];
    if (ship.placed) return;

    if (checkPlacement(ship.length, row, col, orientation)) {
      const newBoard = board.map(r => [...r]);
      const newShips = [...ships];

      // Place the ship on the board
      for (let i = 0; i < ship.length; i++) {
        if (orientation === 'horizontal') {
          newBoard[row][col + i] = 1;
        } else {
          newBoard[row + i][col] = 1;
        }
      }
      
      // Mark the ship as placed
      newShips[selectedShipIndex] = { ...ship, placed: true };
      
      // Find the next unplaced ship and select it
      const nextShipIndex = newShips.findIndex(s => !s.placed);

      setBoard(newBoard);
      setShips(newShips);
      setSelectedShipIndex(nextShipIndex !== -1 ? nextShipIndex : null);
    }
  };

  // Memoize the visual board to prevent re-computation on every render
  const visualBoard = useMemo<Board>(() => {
    const newVisualBoard: Board = board.map(row =>
      row.map(cell => (cell === 1 ? 'ship' : 'empty'))
    );

    if (hoveredCell && selectedShipIndex !== null) {
      const ship = ships[selectedShipIndex];
      const { row, col } = hoveredCell;
      const isValid = checkPlacement(ship.length, row, col, orientation);

      for (let i = 0; i < ship.length; i++) {
        let r = row, c = col;
        if (orientation === 'horizontal') {
          c += i;
        } else {
          r += i;
        }
        if (r < GRID_SIZE && c < GRID_SIZE) {
          newVisualBoard[r][c] = isValid ? 'preview' : 'invalid';
        }
      }
    }
    return newVisualBoard;
  }, [board, hoveredCell, selectedShipIndex, ships, orientation, checkPlacement]);

  // Effect to automatically select the first available ship
  useEffect(() => {
    const firstUnplaced = ships.findIndex(ship => !ship.placed);
    setSelectedShipIndex(firstUnplaced === -1 ? null : firstUnplaced);
  }, [ships]);

  return (
    <Card className="w-full max-w-4xl">
        <CardHeader>
            <CardTitle>Prepare Your Fleet</CardTitle>
            <CardDescription>Place your ships on the board. The layout will be encrypted and committed on-chain.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8">
            <div className="flex-grow">
                <GameBoard
                    board={visualBoard}
                    onCellClick={handleCellClick}
                    onCellEnter={(row, col) => setHoveredCell({ row, col })}
                    onGridLeave={() => setHoveredCell(null)}
                    disabled={allShipsPlaced || isSubmitting}
                />
            </div>
            <div className="w-full md:w-64 flex-shrink-0 space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Your Fleet</h3>
                    <div className="space-y-2">
                        {ships.map((ship, index) => (
                            <div
                                key={ship.name}
                                className={cn(
                                    "p-2 rounded-md border flex justify-between items-center",
                                    { "bg-primary/20 border-primary": selectedShipIndex === index },
                                    { "cursor-pointer hover:bg-muted": !ship.placed },
                                    { "bg-muted text-muted-foreground": ship.placed }
                                )}
                                onClick={() => !ship.placed && setSelectedShipIndex(index)}
                            >
                                <span>{ship.name} ({ship.length})</span>
                                {ship.placed ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    selectedShipIndex === index && <XCircle className="h-5 w-5 text-primary"/>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleRotate} disabled={allShipsPlaced || isSubmitting}>
                        <RotateCw className="mr-2 h-4 w-4"/> Rotate
                    </Button>
                    <Button variant="outline" onClick={handleReset} disabled={isSubmitting}>
                        <Trash2 className="mr-2 h-4 w-4"/> Reset
                    </Button>
                </div>
                
                <Button
                    className="w-full"
                    size="lg"
                    disabled={!allShipsPlaced || isSubmitting}
                    onClick={() => onPlacementComplete(board)}
                >
                    {isSubmitting ? "Submitting..." : "Lock In & Submit Board"}
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
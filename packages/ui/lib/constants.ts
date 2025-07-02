/**
 * @description
 * This file contains constant values used throughout the Cipher Stratego frontend.
 * Centralizing these constants makes the application easier to configure and maintain.
 *
 * Key constants:
 * - `GRID_SIZE`: The dimension of the game board (e.g., 8 for an 8x8 grid).
 * - `SHIP_CONFIG`: An array defining the properties of each ship in the game,
 *   including its name and length. This is the single source of truth for ship data.
 *
 * @notes
 * Any changes to game rules regarding grid size or the ship roster should be
 * made in this file.
 */

// The size of one dimension of the game grid.
export const GRID_SIZE = 8;

// The standard configuration for ships each player receives.
export const SHIP_CONFIG = [
  { name: "Carrier", length: 4 },
  { name: "Battleship", length: 3 },
  { name: "Submarine", length: 2 },
  { name: "Patrol Boat", length: 1 },
];
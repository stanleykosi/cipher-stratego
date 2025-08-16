/**
 * @description
 * This file defines the `check_shot` confidential Arcis circuit.
 * This circuit is the core of the gameplay loop, responsible for confidentially
 * determining if a player's shot is a hit or a miss without revealing the
 * opponent's board layout.
 *
 * @scope
 * - Defines the input struct `BoardRow` for an encrypted row of the game board.
 * - Implements the `check_shot` instruction which performs a confidential
 *   array lookup.
 *
 * @dependencies
 * - `arcis_imports`: Provides all necessary types and macros for writing Arcis circuits.
 */
use arcis_imports::*;

/**
 * @description
 * This module is decorated with `#[encrypted]`, marking it as containing
 * confidential instructions that will be compiled into MPC circuits for execution
 * on the Arcium network.
 */
#[encrypted]
mod circuits {
    use arcis_imports::*;

    /**
     * @description
     * A struct to represent a single row of the game board.
     * This is the data structure that will be encrypted on the client-side and
     * passed into the `check_shot` confidential instruction.
     */
    pub struct BoardRow {
        pub row: [u8; 8],
    }

    /**
     * @description
     * The core confidential instruction for the gameplay loop. It takes an encrypted
     * board row and a public coordinate, confidentially looks up the value
     * at that coordinate, and returns a public result indicating a hit or miss.
     *
     * @inputs
     * - `input_ctxt: Enc<Shared, BoardRow>`: The encrypted representation of one
     *   row of the opponent's board.
     * - `x_coord: u8`: The public column index (0-7) of the shot.
     *
     * @returns
     * - `u8`: A public result. `1` indicates a hit, and `0` indicates a miss.
     */
    #[instruction]
    pub fn check_shot(input_ctxt: Enc<Shared, BoardRow>, x_coord: u8) -> u8 {
        // Convert the encrypted input into a secret-shared representation that
        // the MPC nodes can perform computations on.
        let board_row = input_ctxt.to_arcis();

        // Cast the public x-coordinate to a usize for array indexing.
        let x = x_coord as usize;

        // Perform a confidential lookup into the secret-shared board row.
        // The Arcis compiler ensures this indexing operation does not leak info.
        let cell_value = board_row.row[x];

        // Reveal the secret `cell_value` to the public.
        cell_value.reveal()
    }
}

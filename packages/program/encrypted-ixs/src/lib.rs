/**
 * @description
 * This file defines the confidential Arcis circuit for the Cipher Stratego game.
 * The primary purpose of this circuit is to confidentially determine if a player's
 * shot is a "hit" or a "miss" without revealing the opponent's entire board layout
 * to the Arcium nodes or the public.
 *
 * @scope
 * - Defines the `check_shot` confidential instruction.
 * - Specifies the data structures for encrypted inputs.
 *
 * @dependencies
 * - `arcis_imports`: Provides all necessary types, macros, and functions for
 *   writing Arcis circuits, such as `#[encrypted]`, `#[instruction]`, `Enc`,
 *   `.to_arcis()`, and `.reveal()`.
 *
 * @notes
 * The logic here must be "data-independent," meaning the execution flow cannot
 * depend on secret values. Arcis handles this for operations like array indexing,

 * but developers must avoid constructs like `if (secret_value) { return; }`.
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
      *
      * @fields
      * - `row`: A fixed-size array of 8 `u8` values, where `1` represents a
      *   ship part and `0` represents water.
      */
     pub struct BoardRow {
         pub row: [u8; 8],
     }
 
     /**
      * @description
      * The core confidential instruction for the game. It takes an encrypted
      * board row and a public coordinate, confidentially looks up the value
      * at that coordinate, and returns a public result indicating a hit or miss.
      *
      * @inputs
      * - `input_ctxt: Enc<Shared, BoardRow>`: The encrypted representation of one
      *   row of the opponent's board. The `Enc<Shared, ...>` type indicates it's
      *   encrypted with a shared secret between the client and the Arcium network.
      * - `x_coord: u8`: The public column index (0-7) of the shot. This value is
      *   not encrypted as the target coordinate is public information.
      *
      * @returns
      * - `u8`: A public result. `1` indicates a hit, and `0` indicates a miss.
      *   This value is sent back to the Solana program's callback instruction.
      */
     #[instruction]
     pub fn check_shot(input_ctxt: Enc<Shared, BoardRow>, x_coord: u8) -> u8 {
         // Convert the encrypted input into a secret-shared representation that
         // the MPC nodes can perform computations on. The actual board row values
         // remain secret.
         let board_row = input_ctxt.to_arcis();
 
         // Cast the public x-coordinate to a usize for array indexing.
         let x = x_coord as usize;
 
         // Perform a confidential lookup into the secret-shared board row.
         // The Arcis compiler ensures this indexing operation does not leak
         // any information about the secret value of `x` or the contents of `board_row.row`.
         // The result, `cell_value`, is also a secret-shared value.
         let cell_value = board_row.row[x];
 
         // Reveal the secret `cell_value` to the public. This is the final step
         // that makes the computed result (hit or miss) visible outside the
         // confidential execution environment.
         cell_value.reveal()
     }
 }
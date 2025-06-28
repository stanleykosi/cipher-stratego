/**
 * @description
 * This file defines the confidential Arcis circuits for the Cipher Stratego game.
 * The circuits defined here are executed by the Arcium network to perform
 * computations on encrypted data without revealing the underlying secrets.
 *
 * @scope
 * - Defines the `check_shot` confidential instruction for hit/miss detection.
 * - Defines the `reveal_boards` confidential instruction for end-of-game verification.
 * - Specifies the data structures for encrypted inputs and public outputs.
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

     //================================================================
     // CHECK SHOT CIRCUIT
     //================================================================
 
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
 
     //================================================================
     // REVEAL BOARDS CIRCUIT
     //================================================================
 
     /**
      * @description
      * A struct to represent a complete 8x8 game board.
      * Used by the `reveal_boards` instruction.
      */
     pub struct FullBoard {
         pub board: [[u8; 8]; 8],
     }
 
     /**
      * @description
      * A struct to hold the publicly revealed boards of both players.
      * This is the return type for the `reveal_boards` instruction.
      */
     pub struct RevealedBoards {
         pub p1_board: [[u8; 8]; 8],
         pub p2_board: [[u8; 8]; 8],
     }
 
     /**
      * @description
      * A confidential instruction for the end of the game. It takes two encrypted
      * full boards, decrypts them, and reveals them publicly for verification.
      *
      * @inputs
      * - `p1_board_ctxt: Enc<Shared, FullBoard>`: Player 1's encrypted board.
      * - `p2_board_ctxt: Enc<Shared, FullBoard>`: Player 2's encrypted board.
      *
      * @returns
      * - `RevealedBoards`: A struct containing both players' decrypted boards.
      */
     #[instruction]
     pub fn reveal_boards(
         p1_board_ctxt: Enc<Shared, FullBoard>,
         p2_board_ctxt: Enc<Shared, FullBoard>,
     ) -> RevealedBoards {
         let p1_board_secret = p1_board_ctxt.to_arcis();
         let p2_board_secret = p2_board_ctxt.to_arcis();
 
         RevealedBoards {
             p1_board: p1_board_secret.board.reveal(),
             p2_board: p2_board_secret.board.reveal(),
         }
     }
 }
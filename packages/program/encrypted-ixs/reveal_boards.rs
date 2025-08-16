/**
 * @description
 * This file defines the `reveal_boards` confidential Arcis circuit.
 * This circuit is used at the end of the game to publicly reveal both players'
 * board layouts for verification, proving that no cheating occurred.
 *
 * @scope
 * - Defines the input struct `FullBoard` for a complete encrypted board.
 * - Defines the output struct `RevealedBoards` for the public, decrypted boards.
 * - Implements the `reveal_boards` instruction.
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
     * A struct to represent a complete 8x8 game board.
     * Used as an input for the `reveal_boards` instruction.
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
     * full boards, decrypts them within the MPC environment, and reveals them
     * publicly for verification.
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

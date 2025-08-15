/**
 * @description
 * This file is the main entry point for the Cipher Stratego Solana program.
 * It defines the on-chain state, instructions, and error handling for the game.
 * The program is built using the Anchor framework with the Arcium wrapper, enabling
 * both standard on-chain logic and confidential computations via Arcis circuits.
 *
 * @scope
 * - Defines the `Game` account PDA, which holds the entire state for a single game.
 * - Defines helper data structures like `Shot`, `HitOrMiss`, and `GameState`.
 * - Defines custom program errors for robust validation and client-side feedback.
 * - Declares the main program module `cipher_stratego` where all instructions will be implemented.
 *
 * I have updated this file to:
 * 1.  Implement the logic for the `join_game` instruction. This includes comprehensive validation
 *     to ensure the game is in the correct state, is not already full, and that the joining
 *     player is not the creator.
 * 2.  Upon a successful join, the instruction now updates the `Game` account by storing the second
 *     player's public key and transitioning the `game_state` to `P1Turn`, signaling that
 *     the game is ready for the board submission phase.
 * 3.  Replaced the minimal `Game` struct with the full-featured version from the technical
 *     specification, which includes fields for encrypted board states, nonces, public keys, and
 *     a game log. This prepares the program for subsequent gameplay logic.
 */

use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// Arcium v2 specific types (will be implemented as needed)
// use arcium_anchor::types::{CircuitSource, CallbackAccount, MXEAccount, FeePool};
 
 // Program ID for the deployed Cipher Stratego program on devnet
 declare_id!("G5gFnuGRrLE4eXcZMvY5Fppm9Mis34AtXCo7SsvCdtZm");
 
 // Constants for the Arcis computation definition offsets.
 // These are used to uniquely identify our confidential instructions.
 // TODO: Re-enable when Arcium circuits are built
 // const COMP_DEF_OFFSET_CHECK_SHOT: u32 = comp_def_offset("check_shot");
 // const COMP_DEF_OFFSET_REVEAL_BOARDS: u32 = comp_def_offset("reveal_boards");
 
 /**
  * @description
  * The main module for the Cipher Stratego program, decorated with `#[program]`.
  * This macro replaces Anchor's `#[program]` and is necessary for integrating
  * with the Arcium network. All game logic instructions will be defined within this module.
  */
 #[arcium_program]
 pub mod cipher_stratego {
     use super::*;
 
     // ========================================
     // Instruction Implementations
     // ========================================
 
     /**
      * @description Initializes a new game.
      * Creates the `Game` PDA and sets the caller as Player 1.
      */
         pub fn initialize_game(ctx: Context<InitializeGame>, game_seed: u64) -> Result<()> {
        let game = &mut ctx.accounts.game;
        msg!("Initializing game with seed: {}", game_seed);

        // Set initial game properties
        game.players[0] = ctx.accounts.payer.key();
        game.players[1] = Pubkey::default(); // Player 2 is not yet present
        game.game_state = GameState::AwaitingPlayer;
        game.game_seed = game_seed;
        
        // The rest of the fields are zero-initialized by Anchor's `init` constraint,
        // which serves as a valid default state.

        msg!("Game PDA initialized at address: {}", game.key());
        msg!("Player 1 set to: {}", ctx.accounts.payer.key());
        Ok(())
    }
 
     /**
      * @description Allows a second player to join an existing game.
      *
      * @validation
      * - Fails if the game is not in the `AwaitingPlayer` state.
      * - Fails if the caller is the same as Player 1.
      * - Transitions the game state to `BoardSetup` after P2 joins.
      */
     pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
         let game = &mut ctx.accounts.game;
         let player = &ctx.accounts.player;

         msg!("Player {} attempting to join game {}", player.key(), game.key());

         // Validate game state
         require!(
             game.game_state == GameState::AwaitingPlayer,
             GameError::InvalidGameState
         );

         // Ensure the joining player is not the same as Player 1
         require!(
             game.players[0] != player.key(),
             GameError::PlayerCannotJoinOwnGame
         );

         // Set Player 2
         game.players[1] = player.key();
         game.game_state = GameState::BoardSetup;

         msg!("Player 2 ({}) joined the game. Transitioning to BoardSetup state.", player.key());
         Ok(())
     }
 
         /**
     * @description Submits a player's encrypted board layout.
     *
     * @validation
     * - Fails if the game is not in the `BoardSetup` state.
     * - Fails if the player has already submitted their board.
     * - Transitions the game state to `P1Turn` if both boards are submitted.
     */
    pub fn submit_board(
        ctx: Context<SubmitBoard>,
        encrypted_rows: [[u8; 32]; 8],
        public_key: [u8; 32],
        nonce: [u8; 16],
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        msg!("Player {} submitting board for game {}", player.key(), game.key());

        // Validate that the game is in the correct state for board submission.
        require!(game.game_state == GameState::BoardSetup, GameError::InvalidGameState);

        // Determine if the signer is Player 1 or Player 2.
        let player_index = if player.key() == game.players[0] {
            0
        } else if player.key() == game.players[1] {
            1
        } else {
            // This case should ideally not be hit due to other constraints, but is good for security.
            return Err(GameError::PlayerNotInGame.into());
        };

        // Validate that this player has not already submitted their board.
        require!(!game.boards_submitted[player_index], GameError::BoardAlreadySubmitted);

        // Store the encrypted board data, ephemeral public key, and nonce in the game account.
        game.board_states[player_index] = encrypted_rows;
        game.public_keys[player_index] = public_key;
        game.nonces[player_index] = nonce;
        game.boards_submitted[player_index] = true;

        msg!("Board for player {} successfully submitted.", player_index + 1);

        // If both players have now submitted their boards, the game can begin.
        if game.boards_submitted[0] && game.boards_submitted[1] {
            game.game_state = GameState::P1Turn;
            msg!("Both boards submitted. Game state transitioned to P1Turn.");
        }

        Ok(())
    }
 
             /**
     * @description Placeholder for firing a shot at the opponent's board.
     * Now uses embedded game log in the Game account.
     */
    pub fn fire_shot(
        ctx: Context<FireShot>,
        _computation_offset: u64,
        target_row: u8,
        target_col: u8,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.payer;

        msg!("Player {} firing shot at ({}, {})", player.key(), target_row, target_col);

        // Validate game state and player turn logic here
        require!(
            game.game_state == GameState::P1Turn || game.game_state == GameState::P2Turn,
            GameError::InvalidGameState
        );

        // Create shot record in embedded game log
        let shot = Shot {
            player: player.key(),
            coord: Coordinate { x: target_col, y: target_row },
            result: HitOrMiss::Miss, // Placeholder
        };

        // Add to game log if there's space
        let current_log_idx = game.log_idx as usize;
        if current_log_idx < 64 {
            game.game_log[current_log_idx] = shot;
            game.log_idx += 1;
        }

        game.turn_number += 1;
        msg!("Shot recorded in game log. Turn number: {}", game.turn_number);
        
        Ok(())
    }
 
     
 
     pub fn forfeit(_ctx: Context<ForfeitGame>) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }
 }
 
 // ========================================
 // Account Context Structs
 // ========================================
 
 #[derive(Accounts)]
#[instruction(game_seed: u64)]
pub struct InitializeGame<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + Game::SIZE, // 8 bytes for the account discriminator
        seeds = [b"game", game_seed.to_le_bytes().as_ref()],
        bump
    )]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}
 
 #[derive(Accounts)]
 pub struct JoinGame<'info> {
     pub player: Signer<'info>,
     #[account(mut, seeds = [b"game", game.game_seed.to_le_bytes().as_ref()], bump)]
     pub game: Account<'info, Game>,
 }
 
 #[derive(Accounts)]
pub struct SubmitBoard<'info> {
    pub player: Signer<'info>,
    #[account(
        mut, 
        seeds = [b"game", game.game_seed.to_le_bytes().as_ref()], 
        bump,
        // Ensure the signer is one of the players in the game account.
        constraint = player.key() == game.players[0] || player.key() == game.players[1]
    )]
    pub game: Account<'info, Game>,
}
 
 #[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct FireShot<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"game", game.game_seed.to_le_bytes().as_ref()], bump)]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}
 
 #[derive(Accounts)]
 pub struct FireShotCallback<'info> {
     #[account(mut)]
     pub payer: Signer<'info>,
     #[account(mut)]
     pub game: Account<'info, Game>,
 }
 
 #[derive(Accounts)]
 pub struct ForfeitGame<'info> {
     pub player: Signer<'info>,
     #[account(mut, seeds = [b"game", game.game_seed.to_le_bytes().as_ref()], bump)]
     pub game: Account<'info, Game>,
 }
 
 #[derive(Accounts)]
 pub struct InitCheckShotCompDef<'info> {
     #[account(mut)]
     pub payer: Signer<'info>,
     pub system_program: Program<'info, System>,
 }
 
 // ========================================
 // On-Chain State Structs & Events
 // ========================================
 
 /**
 * @description The main PDA for a single game instance, as per the tech spec.
 */
#[account]
pub struct Game {
    pub players: [Pubkey; 2],                    // 64
    pub turn_number: u64,                        // 8
    // [player_index][row_index][ciphertext]
    pub board_states: [[[u8; 32]; 8]; 2],        // 512 (2 * 8 * 32)
    pub nonces: [[u8; 16]; 2],                   // 32
    pub public_keys: [[u8; 32]; 2],              // 64
    // Public log of all shots fired. Max 64 shots for an 8x8 grid.
    pub game_log: [Shot; 64],                   // 4480 (64 * (32 + 2 + 1 + padding))
    pub log_idx: u8,                             // 1
    pub game_state: GameState,                   // 1
    pub game_seed: u64,                          // 8
    pub boards_submitted: [bool; 2],             // 2
}

impl Game {
    pub const SIZE: usize = 64   // players
        + 8                       // turn_number
        + 512                     // board_states (2 * 8 * 32)
        + 32                      // nonces
        + 64                      // public_keys
        + (70 * 64)               // game_log (Shot is large due to alignment, ~70 bytes * 64)
        + 1                       // log_idx
        + 1                       // game_state (enum repr u8)
        + 8                       // game_seed
        + 2;                      // boards_submitted
}
 
 // BoardData and GameLog are now embedded in the Game account
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, Debug, InitSpace)]
 pub struct Coordinate {
     pub x: u8,
     pub y: u8,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug, InitSpace)]
 pub struct Shot {
     pub player: Pubkey,
     pub coord: Coordinate,
     pub result: HitOrMiss,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, Debug, InitSpace)]
 pub enum HitOrMiss {
     #[default]
     Miss,
     Hit,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, Debug, InitSpace)]
 pub enum GameState {
     #[default]
     AwaitingPlayer, // Game created, waiting for P2
     BoardSetup,     // Both players joined, waiting for boards
     P1Turn,         // Player 1's turn to fire
     P2Turn,         // Player 2's turn to fire
     P1Won,          // Player 1 has won
     P2Won,          // Player 2 has won
 }
 
 #[error_code]
pub enum GameError {
    #[msg("This game is already full.")]
    GameAlreadyFull,
    #[msg("The game is not in the correct state for this action.")]
    InvalidGameState,
    #[msg("This board has already been submitted.")]
    BoardAlreadySubmitted,
    #[msg("It is not your turn.")]
    NotYourTurn,
    #[msg("This square has already been targeted.")]
    SquareAlreadyTargeted,
    #[msg("The game is not over yet.")]
    GameNotOver,
    #[msg("Both players must submit their boards before play can begin.")]
    BoardsNotSubmitted,
    #[msg("A player cannot join a game they created.")]
    PlayerCannotJoinOwnGame,
    #[msg("The player is not a participant in this game.")]
    PlayerNotInGame,
    #[msg("The signer is not a valid player for this game.")]
    InvalidPlayer,
    #[msg("The cluster is not set")]
    ClusterNotSet,
}
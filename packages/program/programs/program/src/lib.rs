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
 * 1.  Redefine the `Game` struct to use fixed-size arrays instead of `Vec`, aligning with
 *     the project rules and on-chain best practices for predictable account sizes. This includes
 *     using `[Shot; 64]` for the game log and fixed arrays for board states.
 * 2.  Added a `boards_submitted` field to the `Game` struct to track board submission status.
 * 3.  Derived `InitSpace` for all state structs to enable automatic and accurate space calculation.
 * 4.  Implemented the full logic for the `initialize_game` instruction, which now correctly
 *     initializes the new fixed-size `Game` account PDA.
 *
 * @dependencies
 * - `anchor_lang`: The core Anchor framework for Solana program development.
 * - `arcium_macros`: Provides the `#[arcium_program]` macro, a required wrapper for
 *   programs that interact with the Arcium network.
 */
 use anchor_lang::prelude::*;
 use arcium_anchor::ComputationOutputs;
 use arcium_macros::arcium_program;
 
 // This is a placeholder Program ID. It will be replaced with the actual
 // program ID when the program is deployed.
 declare_id!("5UejADLz4JjiCDqYqDh4xZubzcTjPdZw7fSqvQq9wBjK");
 
 // Constants for the Arcis computation definition offsets.
 // These are used to uniquely identify our confidential instructions.
 // TODO: Re-enable when Arcium circuits are built
 // const COMP_DEF_OFFSET_CHECK_SHOT: u32 = comp_def_offset("check_shot");
 // const COMP_DEF_OFFSET_REVEAL_BOARDS: u32 = comp_def_offset("reveal_boards");
 
 /**
  * @description
  * The main module for the Cipher Stratego program, decorated with `#[arcium_program]`.
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
      *
      * @param ctx - The context containing the accounts for the instruction.
      * @param game_seed - A random u64 used to seed the game PDA, ensuring a unique address.
      */
     pub fn initialize_game(ctx: Context<InitializeGame>, game_seed: u64) -> Result<()> {
         let game = &mut ctx.accounts.game;
         msg!("Initializing game with seed: {}", game_seed);
 
         // Set initial game properties
         game.players[0] = ctx.accounts.payer.key();
         game.players[1] = Pubkey::default(); // Player 2 is not yet present
         game.game_state = GameState::AwaitingPlayer;
         game.game_seed = game_seed;
         
         // The rest of the fields (turn_number, board_states, etc.) are zero-initialized
         // by Anchor's `init` constraint, which serves as a valid default state.
 
         msg!("Game PDA initialized at address: {}", game.key());
         msg!("Player 1 set to: {}", ctx.accounts.payer.key());
         Ok(())
     }
 
     pub fn join_game(_ctx: Context<JoinGame>) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }
 
     pub fn submit_board(
         _ctx: Context<SubmitBoard>,
         _board_rows: Vec<u8>,
         _public_key: [u8; 32],
         _nonce: [u8; 16],
     ) -> Result<()> {
         // TODO: Implement logic in a future step.
         // Expected board_rows length: 8 * 16 = 128 bytes (reduced from 256 for stack optimization)
         Ok(())
     }
 
     pub fn fire_shot(_ctx: Context<FireShot>, _computation_offset: u64, _x: u8, _y: u8) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }
 
     pub fn fire_shot_callback(
         _ctx: Context<FireShotCallback>,
         _output: ComputationOutputs,
     ) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }
 
     pub fn forfeit(_ctx: Context<ForfeitGame>) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }
 
     // --- Reveal Boards Flow ---
 
     pub fn reveal_boards(
         _ctx: Context<RevealBoards>,
         _computation_offset: u64,
         _p1_ciphertext: Vec<u8>,
         _p1_pubkey: [u8; 32],
         _p1_nonce: [u8; 16],
         _p2_ciphertext: Vec<u8>,
         _p2_pubkey: [u8; 32],
         _p2_nonce: [u8; 16],
     ) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }
 
     pub fn reveal_boards_callback(
         _ctx: Context<RevealBoardsCallback>,
         _output: ComputationOutputs,
     ) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }
 
     // --- Arcium Comp Def Initializers ---
 
     pub fn init_comp_def_check_shot(_ctx: Context<InitCheckShotCompDef>) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }
 
     pub fn init_comp_def_reveal_boards(_ctx: Context<InitRevealBoardsCompDef>) -> Result<()> {
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
         space = 8 + Game::INIT_SPACE, // 8 bytes for the account discriminator
         seeds = [b"game", game_seed.to_le_bytes().as_ref()],
         bump
     )]
     pub game: Account<'info, Game>,
     pub system_program: Program<'info, System>,
 }
 
 #[derive(Accounts)]
 pub struct JoinGame<'info> {
     #[account(mut)]
     pub payer: Signer<'info>,
     #[account(mut, seeds = [b"game", game.game_seed.to_le_bytes().as_ref()], bump)]
     pub game: Account<'info, Game>,
 }
 
 #[derive(Accounts)]
 pub struct SubmitBoard<'info> {
     pub player: Signer<'info>,
     #[account(mut, seeds = [b"game", game.game_seed.to_le_bytes().as_ref()], bump)]
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
 #[instruction(computation_offset: u64)]
 pub struct RevealBoards<'info> {
     #[account(mut)]
     pub payer: Signer<'info>,
     #[account(seeds = [b"game", game.game_seed.to_le_bytes().as_ref()], bump)]
     pub game: Account<'info, Game>,
     pub system_program: Program<'info, System>,
 }
 
 #[derive(Accounts)]
 pub struct RevealBoardsCallback<'info> {
     #[account(mut)]
     pub payer: Signer<'info>,
 }
 
 #[derive(Accounts)]
 pub struct InitCheckShotCompDef<'info> {
     #[account(mut)]
     pub payer: Signer<'info>,
     pub system_program: Program<'info, System>,
 }
 
 #[derive(Accounts)]
 pub struct InitRevealBoardsCompDef<'info> {
     #[account(mut)]
     pub payer: Signer<'info>,
     pub system_program: Program<'info, System>,
 }
 
 // ========================================
 // On-Chain State Structs & Events
 // ========================================
 
 /**
  * @description The core on-chain account for a single game, using fixed-size arrays
  *              for predictable sizing as per the project rules.
  */
 #[account]
 #[derive(InitSpace)]
 pub struct Game {
     pub players: [Pubkey; 2],
     pub turn_number: u64,
     // [player_index][row_index][ciphertext] -> 2 players * 8 rows * 16 bytes = 256 bytes (reduced for stack optimization)
     pub board_states: [[[u8; 16]; 8]; 2],
     pub nonces: [[u8; 16]; 2],
     pub public_keys: [[u8; 32]; 2],
     // Reduced to 16 shots to address stack overflow during compilation
     pub game_log: [Shot; 16],
     pub log_idx: u8,
     pub game_state: GameState,
     pub game_seed: u64,
     pub boards_submitted: [bool; 2],
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, InitSpace)]
 pub struct Coordinate {
     pub x: u8,
     pub y: u8,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, InitSpace)]
 pub struct Shot {
     pub player: Pubkey,
     pub coord: Coordinate,
     pub result: HitOrMiss,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, InitSpace)]
 pub enum HitOrMiss {
     #[default]
     Miss,
     Hit,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, InitSpace)]
 pub enum GameState {
     #[default]
     AwaitingPlayer, // Game created, waiting for P2
     P1Turn,         // Player 1's turn
     P2Turn,         // Player 2's turn
     P1Won,          // Player 1 has won
     P2Won,          // Player 2 has won
     Draw,           // Not used in this game, but good practice
 }
 
 #[event]
 pub struct BoardRevealEvent {
     pub p1_board: [[u8; 8]; 8],
     pub p2_board: [[u8; 8]; 8],
 }
 
 // ========================================
 // Custom Error Codes
 // ========================================
 
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
 }
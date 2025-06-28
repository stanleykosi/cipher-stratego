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
 * @dependencies
 * - `anchor_lang`: The core Anchor framework for Solana program development.
 * - `arcium_macros`: Provides the `#[arcium_program]` macro, which is a required
 *   wrapper for programs that interact with the Arcium network.
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
     // Instruction Stubs
     // ========================================
 
          pub fn initialize_game(_ctx: Context<InitializeGame>, _game_seed: u64) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }

     pub fn join_game(_ctx: Context<JoinGame>) -> Result<()> {
         // TODO: Implement logic in a future step.
         Ok(())
     }

     pub fn submit_board(
         _ctx: Context<SubmitBoard>,
         _board_rows: [[u8; 32]; 8],
         _public_key: [u8; 32],
         _nonce: [u8; 16],
     ) -> Result<()> {
         // TODO: Implement logic in a future step.
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
         space = 8 + std::mem::size_of::<Game>(),
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
  * @description
  * The core on-chain account for a single game of Cipher Stratego.
  */
 #[account]
 pub struct Game {
     pub players: [Pubkey; 2],
     pub turn_number: u64,
     pub board_states: [[[u8; 32]; 8]; 2],
     pub nonces: [[u8; 16]; 2],
     pub public_keys: [[u8; 32]; 2],
     pub game_log: [Shot; 64],
     pub log_idx: u8,
     pub game_state: GameState,
     pub game_seed: u64,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
 pub struct Shot {
     pub player: Pubkey,
     pub coord: (u8, u8),
     pub result: HitOrMiss,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
 pub enum HitOrMiss {
     #[default]
     Miss,
     Hit,
 }
 
 #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
 pub enum GameState {
     #[default]
     AwaitingPlayer,
     P1Turn,
     P2Turn,
     P1Won,
     P2Won,
     Draw,
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
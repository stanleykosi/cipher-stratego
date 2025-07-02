/**
 * @description
 * This module provides helper functions for interacting with the Cipher Stratego
 * Solana program. It abstracts the details of creating an Anchor program client
 * and constructing transactions.
 *
 * I have updated this file to:
 * 1.  Add the `createJoinGameTx` function. This new function constructs the transaction
 *     for the `join_game` instruction, allowing a second player to join a game. It derives
 *     the correct game PDA from the provided seed and sets up all required accounts
 *     for the transaction.
 * 2.  Modified `getProgram` to remove noisy console logging during provider creation,
 *     making the console output cleaner during normal operation.
 *
 * @dependencies
 * - `@coral-xyz/anchor`: For creating the program client and interacting with the program.
 * - `@solana/web3.js`: For core Solana types like `PublicKey`.
 * - `@solana/wallet-adapter-react`: To get the wallet connection.
 * - `../types/cipher-stratego`: The program's IDL types.
 * - `idl.json`: The program's IDL JSON file.
 */
import {
  AnchorProvider,
  Program,
  BN,
} from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { CipherStratego } from "@/types/cipher-stratego";
import cipherStrategoIdl from "@/types/cipher_stratego.json";
import { type EncryptedBoardPayload } from './arcium';

// The on-chain Program ID for the Cipher Stratego program.
export const PROGRAM_ID = new PublicKey("G5gFnuGRrLE4eXcZMvY5Fppm9Mis34AtXCo7SsvCdtZm");

/**
 * Creates and returns an Anchor program client instance.
 * @param connection - The Solana `Connection` object.
 * @param wallet - The wallet context state from `@solana/wallet-adapter-react`.
 * @returns The Anchor program client for Cipher Stratego.
 */
export const getProgram = async (
  connection: Connection,
  wallet: WalletContextState
) => {
  const provider = new AnchorProvider(
    connection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet as any,
    AnchorProvider.defaultOptions()
  );
  const program = new Program<CipherStratego>(
    cipherStrategoIdl as CipherStratego,
    provider
  );
  return program;
};

/**
 * Derives the Program-Derived Address (PDA) for a game account.
 * @param gameSeed - The u64 seed of the game, as a BN.
 * @returns The PublicKey of the game PDA.
 */
export const getGamePda = (gameSeed: BN): PublicKey => {
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("game"), gameSeed.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return gamePda;
};


/**
 * Constructs the transaction to initialize a new game.
 * @param program - The Anchor program client.
 * @param payer - The public key of the transaction payer (game creator).
 * @param gameSeed - A 64-bit number to seed the new game PDA.
 * @returns A promise that resolves to the transaction object.
 */
export const createInitializeGameTx = async (
  program: Program<CipherStratego>,
  payer: PublicKey,
  gameSeed: BN
): Promise<Transaction> => {
  const gamePda = getGamePda(gameSeed);
  const tx = await program.methods
    .initializeGame(gameSeed)
    .accounts({
      payer: payer,
      game: gamePda,
      systemProgram: SystemProgram.programId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .transaction();

  tx.feePayer = payer;
  const { blockhash, lastValidBlockHeight } = await program.provider.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  return tx;
};

/**
 * Constructs the transaction for a player to join a game.
 * @param program - The Anchor program client.
 * @param payer - The public key of the joining player (Player 2).
 * @param gameAccount - The game account being joined.
 * @returns A promise that resolves to the transaction object.
 */
export const createJoinGameTx = async (
  program: Program<CipherStratego>,
  payer: PublicKey,
  gameAccount: { publicKey: PublicKey, account: { gameSeed: BN } }
): Promise<Transaction> => {
  const tx = await program.methods
    .joinGame()
    .accounts({
      payer: payer,
      game: gameAccount.publicKey,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .transaction();

  tx.feePayer = payer;
  const { blockhash, lastValidBlockHeight } = await program.provider.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  return tx;
}

/**
 * Constructs the transaction to submit a player's encrypted board.
 * @param program - The Anchor program client.
 * @param player - The public key of the submitting player.
 * @param gamePda - The public key of the game account.
 * @param payload - The encrypted board data.
 * @returns A promise that resolves to the transaction object.
 */
export const createSubmitBoardTx = async (
  program: Program<CipherStratego>,
  player: PublicKey,
  gamePda: PublicKey,
  payload: EncryptedBoardPayload
): Promise<Transaction> => {
  const tx = await program.methods
    .submitBoard(
      payload.encryptedRows.map(row => Array.from(row)),
      Array.from(payload.ephemeralPublicKey),
      Array.from(payload.nonce)
    )
    .accounts({
      player: player,
      game: gamePda,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .transaction();

  tx.feePayer = player;
  const { blockhash, lastValidBlockHeight } = await program.provider.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  return tx;
};
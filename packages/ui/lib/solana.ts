/**
 * @description
 * This module provides helper functions for interacting with the Cipher Stratego
 * Solana program. It abstracts the details of creating an Anchor program client
 * and constructing transactions.
 *
 * I have updated this file to:
 * 1.  Add a `PROGRAM_ID` constant to hold the on-chain program's address.
 * 2.  Create a `getProgram` function to instantiate and return an Anchor program client,
 *     which simplifies interaction from different UI components.
 * 3.  Implement `createInitializeGameTx`, a function that constructs the transaction
 *     for the `initialize_game` instruction, including calculating the PDA for the
 *     new game account. This encapsulates the on-chain logic from the UI.
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
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { CipherStratego } from "@/types/cipher-stratego";
import idl from "@/types/idl.json";

// The on-chain Program ID for the Cipher Stratego program.
// This must be updated with the deployed program's address.
export const PROGRAM_ID = new PublicKey(idl.address);

/**
 * Creates and returns an Anchor program client instance.
 * @param connection - The Solana `Connection` object.
 * @param wallet - The wallet context state from `@solana/wallet-adapter-react`.
 * @returns The Anchor program client for Cipher Stratego.
 */
export const getProgram = (
  connection: Connection,
  wallet: WalletContextState
) => {
  const provider = new AnchorProvider(
    connection,
    wallet as any,
    AnchorProvider.defaultOptions()
  );
  const program = new Program<CipherStratego>(
    idl as any,
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
) => {
  const gamePda = getGamePda(gameSeed);
  console.log(`Creating 'initializeGame' tx for game PDA: ${gamePda.toBase58()}`);

  const tx = await program.methods
    .initializeGame(gameSeed)
    .transaction();

  return tx;
};
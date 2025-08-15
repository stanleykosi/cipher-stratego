import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CipherStratego } from "../target/types/cipher_stratego";
import { randomBytes } from "crypto";
const { expect } = require("chai");

describe("Cipher Stratego", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.CipherStratego as Program<CipherStratego>;
  const provider = anchor.getProvider();

  let gameKeypair: anchor.web3.Keypair;
  let gameSeed: anchor.BN;

  beforeEach(() => {
    // Generate a new game seed for each test
    gameSeed = new anchor.BN(Math.floor(Math.random() * 1000000));
  });

  it("Can initialize a new game", async () => {
    console.log("Testing game initialization...");

    const tx = await program.methods
      .initializeGame(gameSeed)
      .accountsPartial({
        // Accounts will be auto-resolved by Anchor
      })
      .rpc();

    console.log("Game initialized with transaction:", tx);

    // Derive the game PDA to verify it was created
    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), gameSeed.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const gameAccount = await program.account.game.fetch(gamePda);

    // Verify game state
    expect(gameAccount.gameState).to.deep.equal({ awaitingPlayer: {} });
    expect(gameAccount.gameSeed.toString()).to.equal(gameSeed.toString());
    expect(gameAccount.players[1].toString()).to.equal(PublicKey.default.toString());
  });

  it("Can join an existing game", async () => {
    console.log("Testing joining a game...");

    // First, initialize a game
    const initTx = await program.methods
      .initializeGame(gameSeed)
      .rpc();

    console.log("Game initialized:", initTx);

    // Create a second player
    const player2 = anchor.web3.Keypair.generate();

    // Airdrop SOL to player2 for transaction fees
    const airdropTx = await provider.connection.requestAirdrop(
      player2.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    // Second player joins the game
    const joinTx = await program.methods
      .joinGame()
      .accounts({
        player: player2.publicKey,
      })
      .signers([player2])
      .rpc();

    console.log("Player 2 joined with transaction:", joinTx);

    // Verify game state changed
    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), gameSeed.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const gameAccount = await program.account.game.fetch(gamePda);

    expect(gameAccount.gameState).to.deep.equal({ boardSetup: {} });
    expect(gameAccount.players[1].toString()).to.equal(player2.publicKey.toString());
  });

  it("Can submit board data", async () => {
    console.log("Testing board submission...");

    // Initialize game
    await program.methods.initializeGame(gameSeed).rpc();

    // Join game
    const player2 = anchor.web3.Keypair.generate();
    const airdropTx = await provider.connection.requestAirdrop(
      player2.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    await program.methods
      .joinGame()
      .accounts({ player: player2.publicKey })
      .signers([player2])
      .rpc();

    // Create mock encrypted board data
    const boardHash: number[] = Array.from(randomBytes(32));
    const publicKey: number[] = Array.from(randomBytes(32));
    const nonce: number[] = Array.from(randomBytes(16));

    // Submit board for player 1
    const submitTx = await program.methods
      .submitBoard(boardHash, publicKey, nonce)
      .accounts({
        player: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Board submitted with transaction:", submitTx);

    // Verify board was submitted
    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), gameSeed.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const gameAccount = await program.account.game.fetch(gamePda);
    expect(gameAccount.boardsSubmitted[0]).to.be.true;
  });
});

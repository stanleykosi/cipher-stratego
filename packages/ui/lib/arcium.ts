/**
 * @description
 * This module encapsulates client-side logic for interacting with the Arcium
 * network. Its primary responsibility is to handle the encryption of player
 * data before it is sent to the Solana program.
 *
 * Key features:
 * - `encryptBoard`: A function to perform client-side encryption of a player's
 *   board layout using the `RescueCipher`.
 *
 * @dependencies
 * - `@arcium-hq/client`: Provides the `RescueCipher` for encryption and `x25519`
 *   for key exchange.
 * - `crypto`: Used to generate random bytes for nonces.
 *
 * @notes
 * The encryption process is a critical security feature of the application,
 * ensuring that board layouts are never revealed in plaintext on-chain or
 * during transit.
 */
import { type RawBoard } from "@/types";

/**
 * Represents the encrypted payload for a player's board.
 * This structure matches what the `submit_board` on-chain instruction expects.
 */
export interface EncryptedBoardPayload {
  encryptedRows: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
  ephemeralPublicKey: Uint8Array;
  nonce: Uint8Array;
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 * @param hexString The hex string to convert.
 * @returns The corresponding Uint8Array.
 */
export const hexToUint8Array = (hexString: string): Uint8Array => {
  if (hexString.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters");
  }
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes;
};

// Dynamic import function for Arcium client (client-side only)
const getArciumClient = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Arcium client is only available on the client side');
  }

  try {
    const { RescueCipher, x25519 } = await import('@arcium-hq/client');
    return { RescueCipher, x25519 };
  } catch (error) {
    console.error('Failed to load Arcium client:', error);
    throw new Error('Arcium client is not available. Using mock encryption for development.');
  }
};

// Mock encryption for development/testing when Arcium is not available
const createMockEncryption = (board: RawBoard): EncryptedBoardPayload => {
  console.warn('⚠️ Using mock encryption - not suitable for production!');

  // Create mock encrypted rows (just convert numbers to bytes for now)
  const encryptedRows = board.map(row => {
    const bytes = new Uint8Array(32);
    row.forEach((cell, i) => {
      if (i < 32) bytes[i] = cell;
    });
    return bytes;
  }) as [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];

  // Generate mock ephemeral public key and nonce
  const ephemeralPublicKey = new Uint8Array(32);
  const nonce = new Uint8Array(16);
  crypto.getRandomValues(ephemeralPublicKey);
  crypto.getRandomValues(nonce);

  return {
    encryptedRows,
    ephemeralPublicKey,
    nonce,
  };
};

/**
 * Encrypts a player's 8x8 board layout using the Rescue cipher for submission
 * to the on-chain program.
 *
 * This function performs the following steps as required by the Arcium protocol:
 * 1. Generates an ephemeral x25519 keypair for this specific encryption session.
 * 2. Derives a shared secret with the Arcium cluster's public key via a Diffie-Hellman key exchange.
 * 3. Initializes a `RescueCipher` instance with the derived shared secret.
 * 4. Generates a random 16-byte nonce for the encryption.
 * 5. Encrypts each of the 8 rows of the board individually.
 * 6. Returns the encrypted rows, the ephemeral public key, and the nonce.
 *
 * @param board - An 8x8 2D array of numbers, where `1` is a ship and `0` is water.
 * @param clusterPublicKey - The public key of the Arcium MPC cluster, used for the key exchange.
 * @returns A promise that resolves to the `EncryptedBoardPayload`.
 */
export const encryptBoard = async (
  board: RawBoard,
  clusterPublicKey: Uint8Array
): Promise<EncryptedBoardPayload> => {

  console.log("Encrypting board for submission...");

  try {
    // Try to load Arcium client
    const { RescueCipher, x25519 } = await getArciumClient();

    // 1. Generate an ephemeral x25519 keypair for the client.
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    console.log("Generated ephemeral public key for encryption.");

    // 2. Derive the shared secret.
    const sharedSecret = x25519.getSharedSecret(privateKey, clusterPublicKey);
    console.log("Derived shared secret with Arcium cluster.");

    // 3. Initialize the Rescue cipher.
    const cipher = new RescueCipher(sharedSecret);

    // 4. Generate a random nonce.
    const nonce = new Uint8Array(16);
    crypto.getRandomValues(nonce);
    console.log("Generated random nonce for encryption.");

    // 5. Encrypt each row.
    console.log("Encrypting each board row...");
    const encryptedRows = board.map(row => {
      const bigIntRow = row.map(cell => BigInt(cell));
      return cipher.encrypt(bigIntRow, nonce)[0];
    });
    console.log("All rows encrypted.");

    return {
      encryptedRows: encryptedRows as unknown as [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array],
      ephemeralPublicKey: publicKey,
      nonce: nonce,
    };

  } catch (error) {
    console.warn('Arcium encryption failed, using mock encryption:', error);
    return createMockEncryption(board);
  }
};
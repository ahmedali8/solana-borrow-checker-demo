import * as fs from "node:fs";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  type TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { requireEnv } from "./env";

/** Get a connection to the Solana cluster */
export function getConnection(): Connection {
  return new Connection(requireEnv("ANCHOR_PROVIDER_URL"), { commitment: "confirmed" });
}

/** Get a wallet from the filesystem */
export function getWallet(): Keypair {
  const walletPath = requireEnv("ANCHOR_WALLET").replace(/^~/, process.env.HOME ?? "");
  if (!fs.existsSync(walletPath)) throw new Error(`Wallet file not found: ${walletPath}`);
  const fileContent = fs.readFileSync(walletPath, "utf8");
  const secret = Uint8Array.from(JSON.parse(fileContent));
  return Keypair.fromSecretKey(secret);
}

export async function buildSignAndProcessTx(
  connection: Connection,
  ixs: TransactionInstruction[],
  signers: Keypair[],
  cuLimit: number = 1_400_000, // The maximum Compute Unit limit for a tx
) {
  // Get the latest blockhash
  const latest = await connection.getLatestBlockhash();

  const internalIxs: TransactionInstruction[] = [];

  // Add compute unit limit instruction if specified (as pre-instruction)
  if (cuLimit !== undefined) {
    const cuLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: cuLimit,
    });
    internalIxs.push(cuLimitIx);
  }

  // Add the instructions
  internalIxs.push(...ixs);

  // Construct the message
  const messageV0 = new TransactionMessage({
    payerKey: signers[0].publicKey,
    instructions: internalIxs,
    recentBlockhash: latest.blockhash,
  }).compileToV0Message();

  // Initialize the versioned transaction with the message
  const txV0 = new VersionedTransaction(messageV0);
  txV0.sign([...signers]);

  const signature = await connection.sendTransaction(txV0);
  await connection.confirmTransaction({ signature, ...latest }, "confirmed");

  return signature;
}

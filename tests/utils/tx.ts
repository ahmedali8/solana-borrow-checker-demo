import {
  ComputeBudgetProgram,
  type Keypair,
  type TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { type LiteSVMProvider } from "anchor-litesvm";

export async function executeTx(
  provider: LiteSVMProvider,
  ixs: TransactionInstruction[],
  signerKeys: Keypair[],
  cuLimit: number = 1_400_000, // The maximum Compute Unit limit for a tx
): Promise<string> {
  // Expire the block hash (to avoid blockhash reuse)
  provider.client.expireBlockhash();

  // Get the latest blockhash
  const blockhash = provider.client.latestBlockhash();

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

  const messageV0 = new TransactionMessage({
    payerKey: signerKeys[0].publicKey,
    instructions: internalIxs,
    recentBlockhash: blockhash,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  tx.sign([...signerKeys]);
  return await provider.sendAndConfirm!(tx, signerKeys);
}

import * as anchor from "@coral-xyz/anchor";
import { type Keypair } from "@solana/web3.js";
import { type Counter } from "../../target/types/counter";
import { getPdaCounterAddress } from "../../utils/pda";
import { getCounterProgram } from "../../utils/program";
import { buildSignAndProcessTx, getConnection, getWallet } from "../../utils/tx";

export async function decrementCounterIx(program: anchor.Program<Counter>, payer: Keypair) {
  const counter = getPdaCounterAddress(program.programId);

  const ix = await program.methods
    .decrement()
    .accountsStrict({
      payer: payer.publicKey,
      counter,
    })
    .instruction();

  return ix;
}

async function main() {
  const connection = getConnection();
  const wallet = getWallet();
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = getCounterProgram(provider);
  const ix = await decrementCounterIx(program, wallet);
  const txSig = await buildSignAndProcessTx(connection, [ix], [wallet]);
  console.log(`Transaction sent: ${txSig}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

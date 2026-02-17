import * as anchor from "@coral-xyz/anchor";
import { type Keypair, SystemProgram } from "@solana/web3.js";
import { type Counter } from "../../target/types/counter";
import { getPdaCounterAddress } from "../../utils/pda";
import { getCounterProgram } from "../../utils/program";
import { buildSignAndProcessTx, getConnection, getWallet } from "../../utils/tx";
import { registerIdl } from "../surfpool/cheats";

export async function initializeCounterIx(program: anchor.Program<Counter>, payer: Keypair) {
  const counter = getPdaCounterAddress(program.programId);

  const ix = await program.methods
    .initialize()
    .accountsStrict({
      payer: payer.publicKey,
      counter,
      systemProgram: SystemProgram.programId,
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
  const ix = await initializeCounterIx(program, wallet);
  const txSig = await buildSignAndProcessTx(connection, [ix], [wallet]);
  console.log(`Transaction sent: ${txSig}`);

  // Register IDL
  const idlPath = "target/idl/counter.json";
  const slot = await connection.getSlot();
  const { address, name } = await registerIdl(connection.rpcEndpoint, idlPath, slot);
  console.log(`IDL registered: ${name} at ${address}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

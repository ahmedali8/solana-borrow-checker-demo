import * as anchor from "@coral-xyz/anchor";
import { type Counter } from "../../target/types/counter";
import { getPdaCounterAddress } from "../../utils/pda";
import { getCounterProgram } from "../../utils/program";
import { getConnection, getWallet } from "../../utils/tx";

export async function getCounterCount(program: anchor.Program<Counter>) {
  const counter = getPdaCounterAddress(program.programId);
  const { count } = await program.account.counter.fetch(counter);
  return count.toNumber();
}

// just view-count
async function main() {
  const connection = getConnection();
  const wallet = getWallet();
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = getCounterProgram(provider);
  const count = await getCounterCount(program);
  console.log(`Counter count: ${count}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

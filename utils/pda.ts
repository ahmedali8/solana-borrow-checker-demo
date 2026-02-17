import { PublicKey } from "@solana/web3.js";
import { Seed } from "./constants";

export function getPDAAddress(seeds: Array<Buffer | Uint8Array>, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export function getPdaEventAuthorityAddress(programId: PublicKey): PublicKey {
  return getPDAAddress([Seed.EVENT_AUTHORITY], programId);
}

export function getPdaCounterAddress(programId: PublicKey): PublicKey {
  return getPDAAddress([Seed.COUNTER], programId);
}

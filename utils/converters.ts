import { BN } from "@coral-xyz/anchor";
import { type PublicKey } from "@solana/web3.js";

export function isBN(value: unknown): value is BN {
  return BN.isBN(value);
}

export function isPublicKey(value: unknown): value is PublicKey {
  return value !== null && typeof value === "object" && "toBase58" in value;
}

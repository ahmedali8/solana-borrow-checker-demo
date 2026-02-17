import fs from "node:fs";
import path from "node:path";
import * as anchor from "@coral-xyz/anchor";
import { type LiteSVMProvider } from "anchor-litesvm";
import { type Counter } from "../target/types/counter";

/**
 * Reads an IDL file from the project root and returns it as a anchor.Idl object
 * @param jsonPath - The path to the IDL file from the project root e.g. "target/idl/counter.json"
 * @returns The IDL file
 */
export function readIdl<T extends anchor.Idl>(jsonPath: string): T {
  const idlPath = path.resolve(process.cwd(), jsonPath);
  return JSON.parse(fs.readFileSync(idlPath, "utf8"));
}

export function getProgram<T extends anchor.Idl>(
  provider: LiteSVMProvider | anchor.AnchorProvider,
  idl: T,
): anchor.Program<T> {
  return new anchor.Program(idl, provider);
}

export enum ProgramName {
  Counter = "counter",
}

export function getCounterProgram(provider: LiteSVMProvider | anchor.AnchorProvider): anchor.Program<Counter> {
  return getProgram(provider, readIdl<Counter>("target/idl/counter.json"));
}

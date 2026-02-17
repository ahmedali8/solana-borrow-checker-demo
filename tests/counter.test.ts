import { beforeEach, describe, expect, it } from "bun:test";
import * as anchor from "@coral-xyz/anchor";
import { type Program } from "@coral-xyz/anchor";
import { type Keypair } from "@solana/web3.js";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { Clock } from "litesvm";
import { decrementCounterIx } from "../scripts/instructions/decrement";
import { incrementCounterIx } from "../scripts/instructions/increment";
import { initializeCounterIx } from "../scripts/instructions/init";
import { type Counter } from "../target/types/counter";
import * as Pda from "../utils/pda";
import { getCounterProgram } from "../utils/program";
import { assertEvent, expectError } from "./utils/assertions";
import { executeTx } from "./utils/tx";

describe("counter", () => {
  let provider: LiteSVMProvider;
  let program: Program<Counter>;
  let defaultPayer: Keypair;

  beforeEach(async () => {
    const client = fromWorkspace(".");
    provider = new LiteSVMProvider(client);

    // Set unlimited txn logs
    provider.client.withLogBytesLimit();

    // Ensure block timestamp > 0
    const clk = new Clock(10n, 0n, 0n, 0n, BigInt(Math.max(1, Math.floor(Date.now() / 1000))));
    provider.client.setClock(clk);

    program = getCounterProgram(provider);
    defaultPayer = provider.wallet.payer;
  });

  it("initializes the counter", async () => {
    const counter = Pda.getPdaCounterAddress(program.programId);
    const ix = await initializeCounterIx(program, defaultPayer);
    const txSig = await executeTx(provider, [ix], [defaultPayer]);

    // Verify state
    const account = await program.account.counter.fetch(counter);
    expect(account.count.toNumber()).toBe(0);

    // Verify event
    assertEvent(provider, txSig, "CounterInitialized", {
      counter,
      caller: defaultPayer.publicKey,
    });
  });

  it("increments the counter", async () => {
    const counter = Pda.getPdaCounterAddress(program.programId);

    // Initialize
    const initIx = await initializeCounterIx(program, defaultPayer);
    await executeTx(provider, [initIx], [defaultPayer]);

    // Increment
    const ix = await incrementCounterIx(program, defaultPayer);
    const txSig = await executeTx(provider, [ix], [defaultPayer]);

    // Verify state
    const account = await program.account.counter.fetch(counter);
    expect(account.count.toNumber()).toBe(1);

    // Verify event
    assertEvent(provider, txSig, "CounterUpdated", {
      counter,
      caller: defaultPayer.publicKey,
      count: new anchor.BN(1),
    });
  });

  it("increments the counter multiple times", async () => {
    const counter = Pda.getPdaCounterAddress(program.programId);

    // Initialize
    const initIx = await initializeCounterIx(program, defaultPayer);
    await executeTx(provider, [initIx], [defaultPayer]);

    // Increment 3 times
    for (let i = 0; i < 3; i++) {
      const ix = await incrementCounterIx(program, defaultPayer);
      await executeTx(provider, [ix], [defaultPayer]);
    }

    // Verify state
    const account = await program.account.counter.fetch(counter);
    expect(account.count.toNumber()).toBe(3);
  });

  it("decrements the counter", async () => {
    const counter = Pda.getPdaCounterAddress(program.programId);

    // Initialize and increment twice
    const initIx = await initializeCounterIx(program, defaultPayer);
    await executeTx(provider, [initIx], [defaultPayer]);
    const incIx = await incrementCounterIx(program, defaultPayer);
    await executeTx(provider, [incIx], [defaultPayer]);
    const incIx2 = await incrementCounterIx(program, defaultPayer);
    await executeTx(provider, [incIx2], [defaultPayer]);

    // Decrement
    const ix = await decrementCounterIx(program, defaultPayer);
    const txSig = await executeTx(provider, [ix], [defaultPayer]);

    // Verify state
    const account = await program.account.counter.fetch(counter);
    expect(account.count.toNumber()).toBe(1);

    // Verify event
    assertEvent(provider, txSig, "CounterUpdated", {
      counter,
      caller: defaultPayer.publicKey,
      count: new anchor.BN(1),
    });
  });

  it("rejects decrement below zero (underflow)", async () => {
    // Initialize (count starts at 0)
    const initIx = await initializeCounterIx(program, defaultPayer);
    await executeTx(provider, [initIx], [defaultPayer]);

    // Try to decrement below zero
    const ix = await decrementCounterIx(program, defaultPayer);
    await expectError(executeTx(provider, [ix], [defaultPayer]), "Underflow");
  });

  it("rejects double initialization", async () => {
    // Initialize once
    const initIx = await initializeCounterIx(program, defaultPayer);
    await executeTx(provider, [initIx], [defaultPayer]);

    // Try to initialize again (PDA already exists)
    const initIx2 = await initializeCounterIx(program, defaultPayer);
    await expectError(executeTx(provider, [initIx2], [defaultPayer]));
  });
});

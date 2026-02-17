import { AnchorError, type BN } from "@coral-xyz/anchor";
import { type PublicKey, SendTransactionError } from "@solana/web3.js";
import { type LiteSVMProvider } from "anchor-litesvm";
import { isBN } from "bn.js";
import { assert, expect } from "chai";
import { isPublicKey } from "../../utils/converters";
import { fetchAllEvents } from "./event";

export async function expectError(promise: Promise<unknown>, expectedError?: string | number) {
  let error: unknown;

  try {
    await promise;
    expect.fail(
      expectedError
        ? `Expected transaction to fail with error: ${expectedError}`
        : "Expected transaction to fail but it succeeded",
    );
  } catch (e) {
    error = e;
  }

  // If no specific error is expected, just verify that an error was thrown
  if (!expectedError) {
    expect(error).to.be.instanceOf(SendTransactionError || Error);
    return;
  }

  expect(error).to.not.be.undefined;

  if (error instanceof AnchorError) {
    const errorCode = error.error.errorCode;

    expect(errorCode.code).to.not.be.undefined;
    if (typeof expectedError === "number") {
      expect(errorCode.number).to.be.equal(expectedError);
    } else {
      expect(errorCode.code).to.be.equal(expectedError);
    }
  } else if (error instanceof SendTransactionError) {
    if (!error.logs) throw new Error("Transaction logs are missing");

    // Check if the expected error appears in the logs
    // Format: "Program log: AnchorError ... Error Code: Unauthorized. Error Number: 6002. Error Message: unauthorized."
    const searchTerm =
      typeof expectedError === "number" ? `Error Number: ${expectedError}` : `Error Code: ${expectedError}`;
    const hasAnchorError = error.logs.some((log) => log.includes(searchTerm));
    const hasSubstringMatch =
      typeof expectedError === "string" ? error.logs.some((log) => log.includes(expectedError)) : false;
    const message = `Expected error ${expectedError} not found in logs \n ${error.logs.join("\n") || "[]"}`;
    expect(hasAnchorError || hasSubstringMatch, message).to.be.true;
  } else {
    throw new Error(`Unexpected error: ${error}`);
  }
}

function compareValues(actual: unknown, expected: unknown, fieldName: string): void {
  if (isPublicKey(expected) && isPublicKey(actual)) {
    assertEqPublicKey(actual, expected, fieldName);
  } else if (isBN(expected) && isBN(actual)) {
    assertEqBn(actual, expected, fieldName);
  } else if (Array.isArray(expected) && Array.isArray(actual)) {
    expect(actual.length, `${fieldName}.length`).to.equal(expected.length);
    for (let i = 0; i < expected.length; i++) {
      compareValues(actual[i], expected[i], `${fieldName}[${i}]`);
    }
  } else {
    expect(actual, fieldName).to.deep.equal(expected);
  }
}

export function assertEvent(
  provider: LiteSVMProvider,
  sig: string,
  eventName: string,
  expectedData?: Record<string, unknown>,
  eventIdx: number = 0,
) {
  const events = fetchAllEvents(provider, sig).filter((e) => e.event.name.toLowerCase() === eventName.toLowerCase());

  if (events.length < eventIdx + 1) {
    // Only log events if the expected event is not found
    console.error("Available events:", JSON.stringify(events, null, 2));
    expect.fail(`Event "${eventName}" index ${eventIdx} not found in transaction ${sig}`);
  }

  const event = events[eventIdx];

  if (expectedData) {
    for (const [key, expected] of Object.entries(expectedData)) {
      const actual = event.event.data[key];
      const fieldName = `${eventName}.${key}`;

      if (actual === undefined) {
        expect.fail(`Field "${key}" not found in event "${eventName}"`);
      }

      compareValues(actual, expected, fieldName);
    }
  }
}

export function assertEqPublicKey(left: PublicKey, right: PublicKey, message?: string) {
  const defaultMessage = `PublicKey mismatch: ${left.toBase58()} !== ${right.toBase58()}`;
  assert.isTrue(left.equals(right), message ?? defaultMessage);
}

export function assertEqBn(left: BN, right: BN, message?: string) {
  const defaultMessage = `BN values mismatch: ${left.toString()} !== ${right.toString()}`;
  assert.isTrue(left.eq(right), message ?? defaultMessage);
}

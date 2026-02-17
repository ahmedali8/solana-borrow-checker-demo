import { expect } from "bun:test";
import { AnchorError, type BN } from "@coral-xyz/anchor";
import { type PublicKey, SendTransactionError } from "@solana/web3.js";
import { type LiteSVMProvider } from "anchor-litesvm";
import { isBN } from "bn.js";
import { isPublicKey } from "../../utils/converters";
import { fetchAllEvents } from "./event";

export async function expectError(promise: Promise<unknown>, expectedError?: string | number) {
  try {
    await promise;
  } catch (error: unknown) {
    // If no specific error is expected, just verify that an error was thrown
    if (!expectedError) {
      expect(error).toBeInstanceOf(Error);
      return;
    }

    if (error instanceof AnchorError) {
      const errorCode = error.error.errorCode;

      expect(errorCode.code).toBeDefined();
      if (typeof expectedError === "number") {
        expect(errorCode.number).toBe(expectedError);
      } else {
        expect(errorCode.code).toBe(expectedError);
      }
    } else if (error instanceof SendTransactionError) {
      if (!error.logs) throw new Error("Transaction logs are missing");

      const searchTerm =
        typeof expectedError === "number" ? `Error Number: ${expectedError}` : `Error Code: ${expectedError}`;
      const hasAnchorError = error.logs.some((log) => log.includes(searchTerm));
      const hasSubstringMatch =
        typeof expectedError === "string" ? error.logs.some((log) => log.includes(expectedError)) : false;

      if (!(hasAnchorError || hasSubstringMatch)) {
        throw new Error(`Expected error ${expectedError} not found in logs \n ${error.logs.join("\n") || "[]"}`);
      }
    } else {
      throw new Error(`Unexpected error: ${error}`);
    }
    return;
  }

  // If we reach here, the promise resolved successfully but should have failed
  throw new Error(
    expectedError
      ? `Expected transaction to fail with error: ${expectedError}`
      : "Expected transaction to fail but it succeeded",
  );
}

function compareValues(actual: unknown, expected: unknown, fieldName: string): void {
  if (isPublicKey(expected) && isPublicKey(actual)) {
    assertEqPublicKey(actual, expected, fieldName);
  } else if (isBN(expected) && isBN(actual)) {
    assertEqBn(actual, expected, fieldName);
  } else if (Array.isArray(expected) && Array.isArray(actual)) {
    if (actual.length !== expected.length) {
      throw new Error(`${fieldName}.length: expected ${expected.length} but got ${actual.length}`);
    }
    for (let i = 0; i < expected.length; i++) {
      compareValues(actual[i], expected[i], `${fieldName}[${i}]`);
    }
  } else {
    expect(actual).toEqual(expected);
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
    console.error("Available events:", JSON.stringify(events, null, 2));
    throw new Error(`Event "${eventName}" index ${eventIdx} not found in transaction ${sig}`);
  }

  const event = events[eventIdx];

  if (expectedData) {
    for (const [key, expected] of Object.entries(expectedData)) {
      const actual = event.event.data[key];
      const fieldName = `${eventName}.${key}`;

      if (actual === undefined) {
        throw new Error(`Field "${key}" not found in event "${eventName}"`);
      }

      compareValues(actual, expected, fieldName);
    }
  }
}

export function assertEqPublicKey(left: PublicKey, right: PublicKey, message?: string) {
  const defaultMessage = `PublicKey mismatch: ${left.toBase58()} !== ${right.toBase58()}`;
  if (!left.equals(right)) throw new Error(message ?? defaultMessage);
}

export function assertEqBn(left: BN, right: BN, message?: string) {
  const defaultMessage = `BN values mismatch: ${left.toString()} !== ${right.toString()}`;
  if (!left.eq(right)) throw new Error(message ?? defaultMessage);
}

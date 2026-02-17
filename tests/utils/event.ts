import * as anchor from "@coral-xyz/anchor";
import { type LiteSVMProvider } from "anchor-litesvm";
import bs58 from "bs58";
import { type TransactionMetadata } from "litesvm";
import { getCounterProgram, ProgramName } from "../../utils/program";

export interface DecodedEvent {
  programId: string;
  programName: ProgramName;
  event: anchor.Event;
}

export function fetchAllEvents(provider: LiteSVMProvider, sig: string): DecodedEvent[] {
  const tx = provider.client.getTransaction(new Uint8Array(bs58.decode(sig))) as TransactionMetadata;

  const decoders = [{ program: getCounterProgram(provider), name: ProgramName.Counter }];

  const events: DecodedEvent[] = [];
  const seenPayloads = new Set<string>();

  // Helper to try decoding with all programs
  const tryDecode = (base64Data: string) => {
    for (const { program, name } of decoders) {
      try {
        const event = program.coder.events.decode(base64Data);
        if (event) {
          const dedupeKey = `${program.programId.toString()}:${base64Data}`;
          if (seenPayloads.has(dedupeKey)) {
            return;
          }
          events.push({
            programId: program.programId.toString(),
            programName: name,
            event,
          });
          seenPayloads.add(dedupeKey);
          return; // Stop after first successful decode
        }
      } catch {
        // Try next program
      }
    }
  };

  // Method 1: Parse events from inner instructions (CPI events)
  for (const instruction of tx.innerInstructions().flat()) {
    const data = instruction.instruction().data();
    if (data.length < 8) continue;

    const base64Data = anchor.utils.bytes.base64.encode(Buffer.from(data.subarray(8)));
    tryDecode(base64Data);
  }

  // Method 2: Parse events from transaction logs (standard Anchor events)
  for (const log of tx.logs()) {
    const match = log.match(/^Program data: (.+)$/);
    if (!match) continue;

    tryDecode(match[1]);
  }

  return events;
}

export function fetchEvent(provider: LiteSVMProvider, sig: string, eventName: string): DecodedEvent {
  const events = fetchAllEvents(provider, sig);
  const event = events.find((e) => e.event.name === eventName);
  if (!event) {
    throw new Error(`Event "${eventName}" not found`);
  }
  return event;
}

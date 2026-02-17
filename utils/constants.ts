import { Buffer } from "node:buffer";

export namespace Seed {
  export const COUNTER = Buffer.from("counter_seed");

  export const EVENT_AUTHORITY = Buffer.from("__event_authority");
}

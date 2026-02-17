import fs from "node:fs";
import axios from "axios";
import { resolveProjectPath } from "../../utils/env";

export async function registerIdl(
  rpcUrl: string,
  idlPath: string,
  slot: number,
): Promise<{ address: string; name: string }> {
  const fullPath = resolveProjectPath(idlPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`IDL file not found: ${fullPath}`);
  }

  const idlContent = fs.readFileSync(fullPath, "utf8");
  const idl = JSON.parse(idlContent);
  const body = {
    id: 1,
    jsonrpc: "2.0",
    method: "surfnet_registerIdl",
    params: [
      {
        ...idl,
        address: idl.address,
      },
      slot,
    ],
  };

  const resp = await axios.post(rpcUrl, body, {
    headers: { "Content-Type": "application/json" },
  });

  if (resp.data?.error) {
    throw new Error(`surfnet_registerIdl error for ${idl.metadata.name}: ${JSON.stringify(resp.data.error)}`);
  }

  return { address: idl.address, name: idl.metadata.name };
}

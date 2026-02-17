import path from "node:path";

/** Require an environment variable to be set */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export function resolveProjectPath(p: string): string {
  const rel = p.startsWith("@") ? p.slice(1) : p;
  if (path.isAbsolute(rel)) return rel;
  return path.resolve(process.cwd(), rel);
}

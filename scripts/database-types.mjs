import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2];
const outputPath = resolve("src/lib/database.types.ts");

if (mode !== "--write" && mode !== "--check") {
  console.error("Usage: node scripts/database-types.mjs --write|--check");
  process.exit(2);
}

const generated = spawnSync(
  "pnpm",
  ["exec", "supabase", "gen", "types", "typescript", "--local"],
  { encoding: "utf8" },
);

if (generated.status !== 0) {
  process.stderr.write(generated.stderr || generated.stdout || `${generated.error?.message ?? "Database type generation failed."}\n`);
  process.exit(generated.status ?? 1);
}

if (mode === "--write") {
  writeFileSync(outputPath, generated.stdout);
  console.log(`Generated ${outputPath}`);
  process.exit(0);
}

let committed;

try {
  committed = readFileSync(outputPath, "utf8");
} catch {
  console.error("Database types are missing. Run `pnpm db:types` and commit the result.");
  process.exit(1);
}

if (committed !== generated.stdout) {
  console.error("Database types are stale. Run `pnpm db:types` and commit the result.");
  process.exit(1);
}

console.log("Database types match the local schema.");

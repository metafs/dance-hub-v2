import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2];
const outputPath = resolve("src/lib/database.types.ts");
const adapterFunctionNames = new Set([
  "create_event_draft_with_content",
  "replace_event_revision_content",
  "save_event_revision_with_content",
]);

function generatedSchemaTypes(output) {
  let skippingAdapterFunction = false;
  return output.split(/(?<=\n)/).filter((line) => {
    if (!skippingAdapterFunction) {
      const match = line.match(/^      ([a-z_]+): \{$/);
      if (match && adapterFunctionNames.has(match[1])) {
        skippingAdapterFunction = true;
        return false;
      }
      return true;
    }

    if (/^      },?\r?\n?$/.test(line)) skippingAdapterFunction = false;
    return false;
  }).join("");
}

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

// These aggregate RPCs use JSON payloads and are typed in supabase.types.ts,
// alongside the bigint serialization adapter. Keep generated table/schema
// types reproducible without duplicating those application-facing RPC types.
const schemaTypes = generatedSchemaTypes(generated.stdout);

if (mode === "--write") {
  writeFileSync(outputPath, schemaTypes);
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

if (committed !== schemaTypes) {
  console.error("Database types are stale. Run `pnpm db:types` and commit the result.");
  process.exit(1);
}

console.log("Database types match the local schema.");

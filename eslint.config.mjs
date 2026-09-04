import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.join(projectRoot, "src");
const featuresRoot = path.join(sourceRoot, "features");
const featureNames = fs.readdirSync(featuresRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

function commandSurfacePaths(featureName) {
  return [
    path.join(featuresRoot, featureName, "commands.ts"),
    path.join(featuresRoot, featureName, "commands.tsx"),
    path.join(featuresRoot, featureName, "commands"),
  ];
}

// Discover feature names so a newly added feature cannot silently bypass this boundary.
const crossFeatureCommandZones = featureNames.flatMap((featureName) =>
  featureNames
    .filter((otherFeatureName) => otherFeatureName !== featureName)
    .map((otherFeatureName) => ({
      target: commandSurfacePaths(featureName),
      from: commandSurfacePaths(otherFeatureName),
      message:
        "A feature command surface cannot import another feature's command surface. Depend on a query, policy, schema, or type instead.",
    })),
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      "import/no-restricted-paths": ["error", {
        zones: [
          {
            target: path.join(sourceRoot, "app"),
            from: path.join(sourceRoot, "lib", "supabase"),
            message:
              "Route composition must use a feature query, command, or component instead of importing a Supabase client.",
          },
          ...crossFeatureCommandZones,
          {
            target: path.join(sourceRoot, "ui"),
            from: [
              path.join(sourceRoot, "features"),
              path.join(sourceRoot, "lib"),
            ],
            message:
              "src/ui is domain-agnostic. Pass display-ready props and callbacks from app or features instead of importing domain code.",
          },
        ],
      }],
    },
  },
  {
    files: ["src/app/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@supabase/*"],
            message:
              "Route composition must use a feature query, command, or component instead of importing a Supabase package.",
          },
        ],
      }],
    },
  },
]);

export default eslintConfig;

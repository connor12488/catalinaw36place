import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(appRoot, "../..");
const source = path.resolve(repoRoot, "qa/rental-qa.yaml");
const target = path.resolve(appRoot, "qa/rental-qa.yaml");
const qaSource = (process.env.QA_SOURCE || "db").toLowerCase();

if (!fs.existsSync(source)) {
  const message = `Unable to find source Q&A file: ${source}`;

  if (qaSource === "yaml") {
    throw new Error(message);
  }

  console.warn(`${message}. Skipping YAML bundle sync because QA_SOURCE=${qaSource}.`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);

console.log(`Copied ${path.relative(repoRoot, source)} to ${path.relative(repoRoot, target)}`);

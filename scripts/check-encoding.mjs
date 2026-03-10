#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const textExt = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".prisma", ".css", ".yml", ".yaml", ".sh"
]);

const mojibakeTokensBase64 = [
  "6ZG15o2Q7oaG",
  "6aqe5Yay55Wo",
  "6Y2X5bqi6byO",
  "6Y+J5bqh5rST",
  "5a+u54qx56yB",
  "54C544ih5Z+b6Y605oSs5aeb",
  "57yB5b+a5oOA6ZCp7oa954ij",
  "57yB5Yut57KQ6Y2P5bSH6YO0",
  "5rWg5bOw4oKs54WO5Y6s6ZCc",
];

const mojibakePatterns = [
  ...mojibakeTokensBase64.map((token) => new RegExp(Buffer.from(token, "base64").toString("utf8"), "g")),
  new RegExp(String.fromCodePoint(0xfffd), "g"),
];

function getStagedFiles() {
  const output = runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]);
  if (!output) return [];
  return output.split("\0").map((line) => line.trim()).filter(Boolean);
}

function runGit(args) {
  const result = spawnSync("git", ["-c", "core.quotepath=false", ...args], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }
  return result.stdout ?? "";
}

function isTextFile(filePath) {
  return textExt.has(path.extname(filePath).toLowerCase());
}

function checkFile(filePath) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) return [];
  if (!isTextFile(filePath)) return [];

  const buf = fs.readFileSync(absolute);
  const errors = [];

  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    errors.push(`BOM detected: ${filePath}`);
  }

  const text = buf.toString("utf8");
  for (const pattern of mojibakePatterns) {
    if (pattern.test(text)) {
      errors.push(`Possible mojibake pattern "${pattern.source}" in ${filePath}`);
    }
  }

  return errors;
}

function main() {
  const mode = process.argv.includes("--staged") ? "staged" : "all";
  const files = mode === "staged"
    ? getStagedFiles()
    : runGit(["ls-files", "-z"]).split("\0").map((line) => line.trim()).filter(Boolean);

  const allErrors = files.flatMap(checkFile);
  if (allErrors.length) {
    console.error("[check-encoding] failed:");
    for (const err of allErrors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log("[check-encoding] passed");
}

main();

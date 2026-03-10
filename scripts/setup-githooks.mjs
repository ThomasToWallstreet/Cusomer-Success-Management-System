#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";

function hasGit() {
  const result = spawnSync("git", ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

if (!hasGit()) {
  console.log("[hooks] git not found, skip setup");
  process.exit(0);
}

execSync("git config core.hooksPath .githooks", { stdio: "inherit" });
console.log("[hooks] core.hooksPath => .githooks");

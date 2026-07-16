import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./preinstall.mjs", import.meta.url));

function makeWorkspace(t) {
  const workspace = mkdtempSync(join(tmpdir(), "ytt-preinstall-"));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  return workspace;
}

function runPreinstall(workspace, userAgent) {
  const env = { ...process.env };
  if (userAgent === undefined) {
    delete env.npm_config_user_agent;
  } else {
    env.npm_config_user_agent = userAgent;
  }

  return spawnSync(process.execPath, [scriptPath], {
    cwd: workspace,
    encoding: "utf8",
    env,
  });
}

test("removes npm and Yarn lockfiles for a pnpm invocation", (t) => {
  const workspace = makeWorkspace(t);
  const packageLock = join(workspace, "package-lock.json");
  const yarnLock = join(workspace, "yarn.lock");
  writeFileSync(packageLock, "{}\n");
  writeFileSync(yarnLock, "# fixture\n");

  const result = runPreinstall(workspace, "pnpm/10.0.0 node/v24.0.0");

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(existsSync(packageLock), false);
  assert.equal(existsSync(yarnLock), false);
});

test("removes lockfiles before rejecting a non-pnpm invocation", (t) => {
  const workspace = makeWorkspace(t);
  const packageLock = join(workspace, "package-lock.json");
  const yarnLock = join(workspace, "yarn.lock");
  writeFileSync(packageLock, "{}\n");
  writeFileSync(yarnLock, "# fixture\n");

  const result = runPreinstall(workspace, "npm/11.0.0 node/v24.0.0");

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^Use pnpm instead\r?\n$/);
  assert.equal(existsSync(packageLock), false);
  assert.equal(existsSync(yarnLock), false);
});

test("ignores absent lockfiles and rejects a missing user agent", (t) => {
  const workspace = makeWorkspace(t);

  const result = runPreinstall(workspace, undefined);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /^Use pnpm instead\r?\n$/);
});

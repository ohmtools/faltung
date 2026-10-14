// Pre-commit-Hook (`.githooks/pre-commit`): erhöht die Patch-Version in
// `package.json` und `package-lock.json`, außer der Commit ändert sie schon.
// Die Version steht im Footer, so lässt sich jeder Stand unterscheiden.
// Index und Arbeitskopie werden getrennt angepasst: nichts, was nicht
// gestaged war, wird gestaged.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FILES = ["package.json", "package-lock.json"];

function git(args, { input, env } = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    input,
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "ignore"],
  }).trimEnd();
}

function tryGit(args, options) {
  try {
    return git(args, options);
  } catch {
    return null;
  }
}

function versionOf(text) {
  try {
    return JSON.parse(text).version ?? null;
  } catch {
    return null;
  }
}

// npm schreibt beide Dateien als `JSON.stringify(…, null, 2)` plus Zeilenumbruch,
// das ändert also nur die Versionszeilen.
function withVersion(text, version) {
  const json = JSON.parse(text);
  json.version = version;
  if (json.packages?.[""]) json.packages[""].version = version;
  return JSON.stringify(json, null, 2) + "\n";
}

// `git commit --amend` vergleicht mit dem Vorgänger des geänderten Commits, sonst
// würde jedes Amend erneut erhöhen. Der Hook startet node per `exec`, der
// Elternprozess ist also `git commit` selbst. Nach bestem Bemühen: `/proc` unter
// Linux, sonst `ps`; geht beides nicht, wird kein Amend erkannt.
function parentArgs() {
  try {
    return fs.readFileSync(`/proc/${process.ppid}/cmdline`, "utf8").split("\0");
  } catch {
    try {
      const ps = ["-o", "args=", "-p", String(process.ppid)];
      return execFileSync("ps", ps, { encoding: "utf8" }).trim().split(/\s+/);
    } catch {
      return [];
    }
  }
}

// Die zu schreibenden Indizes. `git commit <pfade>` committet aus einem temporären
// `next-index-*.lock` und übernimmt danach `index.lock` als echten Index: beide
// brauchen die neue Version, sonst steht der Index eine Version hinter HEAD.
function indexes() {
  const current = process.env.GIT_INDEX_FILE;
  if (!current || !path.basename(current).startsWith("next-index-")) return [undefined];
  return [current, path.join(git(["rev-parse", "--absolute-git-dir"]), "index.lock")];
}

function setStaged(file, version, index) {
  const env = index ? { GIT_INDEX_FILE: index } : undefined;
  const entry = tryGit(["ls-files", "-s", "--", file], { env });
  if (!entry) return;
  const text = git(["show", `:${file}`], { env });
  if (versionOf(text) === version) return;
  const blob = git(["hash-object", "-w", "--stdin"], { input: withVersion(text, version) });
  git(["update-index", "--cacheinfo", `${entry.split(" ")[0]},${blob},${file}`], { env });
}

if (process.env.SKIP_VERSION_BUMP) process.exit(0);

const base = parentArgs().includes("--amend") ? "HEAD~1" : "HEAD";
const before = tryGit(["show", `${base}:package.json`]);
// Erster Commit (oder Amend darauf): nichts zum Vergleichen.
if (before === null) process.exit(0);

const old = versionOf(before);
const staged = versionOf(git(["show", ":package.json"]));
let target = staged;
if (staged === old) {
  const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(old ?? "");
  if (!parts) {
    console.warn(`bump-version: "${old}" is not major.minor.patch, left alone.`);
    process.exit(0);
  }
  target = `${parts[1]}.${parts[2]}.${Number(parts[3]) + 1}`;
}

// Eine nur in `package.json` von Hand gesetzte Version kommt trotzdem ins Lockfile.
for (const file of FILES) {
  const was = versionOf(tryGit(["show", `:${file}`]) ?? "");
  if (was === null || was === target) continue;
  for (const index of indexes()) setStaged(file, target, index);

  // Die Arbeitskopie folgt nur, wenn sie dieselbe Version wie der Index hatte; eine
  // dort geänderte, nicht gestagte Version gehört dem Entwickler und bleibt.
  const work = fs.readFileSync(file, "utf8");
  if (versionOf(work) === was) fs.writeFileSync(file, withVersion(work, target));
  else console.warn(`bump-version: ${file} has an unstaged version change, left alone.`);
}

if (target !== staged) console.log(`bump-version: ${old} -> ${target}`);

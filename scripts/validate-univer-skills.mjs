#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const skillsRoot = path.join(root, "skills");
const discoverySkills = ["univer-cli", "univer-workspace-cli"];
const sdkSkills = [
  "univer-integrate",
  "univer-pro-integrate",
  "univer-node-backend",
  "univer-plugin-dev",
  "univer-customize-theme"
];
const generatedIntegrationSkills = [
  "univer-cli-sdk-integration",
  "univer-collaboration-integration"
];
const buildSkill = "build-univer-app";
const officialSkills = [buildSkill, ...sdkSkills, ...generatedIntegrationSkills, ...discoverySkills];
const buildUniverAppFiles = [
  "SKILL.md",
  "agents/openai.yaml",
  "references/architecture.md",
  "references/sdk-boundaries.md",
  "references/sources.md"
];
const buildUniverAppDocs = [
  "README.md",
  "README.zh-CN.md",
  "architecture.md",
  "architecture.zh-CN.md",
  "sdk-boundaries.md",
  "sdk-boundaries.zh-CN.md",
  "sources.md"
];
const removedWorkflowSkills = [
  "using-univer-cli",
  "writing-univer-plans",
  "executing-univer-plans",
  "test-driven-univer-development"
];

const errors = [];
const warnings = [];
const reports = [];

function recordError(message) {
  errors.push(message);
}

function recordWarning(message) {
  warnings.push(message);
}

function recordDrift({ failOnDrift, message, skill }) {
  if (failOnDrift) {
    recordError(message);
    return;
  }

  recordWarning(withSyncCommand(message, skill));
}

function unixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function relativeToRoot(filePath) {
  return unixPath(path.relative(root, filePath));
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

function parseFrontmatter(text, filePath) {
  if (!text.startsWith("---\n")) {
    recordError(`${relativeToRoot(filePath)}: missing frontmatter`);
    return {};
  }

  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    recordError(`${relativeToRoot(filePath)}: unterminated frontmatter`);
    return {};
  }

  const data = {};
  const body = text.slice(4, end);
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return data;
}

async function collectMarkdownFiles(dirPath) {
  const result = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(dirPath, entry.name);
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    if (entry.isDirectory()) {
      result.push(...await collectMarkdownFiles(filePath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) result.push(filePath);
  }
  return result;
}

async function validateSkillStructure() {
  for (const skill of officialSkills) {
    const skillPath = path.join(skillsRoot, skill);
    const skillFile = path.join(skillPath, "SKILL.md");
    if (!existsSync(skillFile)) {
      recordError(`skills/${skill}/SKILL.md: missing entry file`);
      continue;
    }

    const text = await readText(skillFile);
    const frontmatter = parseFrontmatter(text, skillFile);
    if (frontmatter.name !== skill) {
      recordError(`skills/${skill}/SKILL.md: frontmatter name must be ${skill}`);
    }
    if (!frontmatter.description) {
      recordError(`skills/${skill}/SKILL.md: description must exist`);
    }

    if (sdkSkills.includes(skill)) {
      if (text.split(/\r?\n/).length > 500) {
        recordError(`skills/${skill}/SKILL.md: must stay under 500 lines`);
      }
      if (!existsSync(path.join(skillPath, "agents", "openai.yaml"))) {
        recordError(`skills/${skill}/agents/openai.yaml: missing agent metadata`);
      }
    }

    if (generatedIntegrationSkills.includes(skill)) {
      if (!text.includes("generated-by: generate-sdk-integration-skill; do not edit")) {
        recordError(`skills/${skill}/SKILL.md: missing generated artifact marker`);
      }
      for (const relativeFile of ["agents/openai.yaml", "references"]) {
        if (!existsSync(path.join(skillPath, relativeFile))) {
          recordError(`skills/${skill}/${relativeFile}: missing generated resource`);
        }
      }
    }
  }

  for (const skill of discoverySkills) {
    const skillPath = path.join(skillsRoot, skill);
    const skillFile = path.join(skillPath, "SKILL.md");
    if (!existsSync(skillFile)) continue;

    const text = await readText(skillFile);
    const frontmatter = parseFrontmatter(text, skillFile);
    if (!frontmatter.description?.startsWith("Use")) {
      recordError(`skills/${skill}/SKILL.md: discovery description must start with "Use"`);
    }
    if (frontmatter.hidden !== "true") {
      recordError(`skills/${skill}/SKILL.md: discovery skill must be hidden`);
    }
    const entries = await fs.readdir(skillPath);
    if (entries.length !== 1 || entries[0] !== "SKILL.md") {
      recordError(`skills/${skill}: discovery skill directory must contain only SKILL.md`);
    }
  }

  const buildSkillPath = path.join(skillsRoot, buildSkill);
  for (const relativeFile of buildUniverAppFiles) {
    if (!existsSync(path.join(buildSkillPath, relativeFile))) {
      recordError(`skills/${buildSkill}/${relativeFile}: missing rich skill resource`);
    }
  }

  const docsPath = path.join(root, "docs", "univer-office-suite");
  for (const relativeFile of buildUniverAppDocs) {
    if (!existsSync(path.join(docsPath, relativeFile))) {
      recordError(`docs/univer-office-suite/${relativeFile}: missing developer document`);
    }
  }

  reports.push(`structure: ${officialSkills.length} official skills checked`);
}

async function validateReadmes() {
  const readmes = ["README.md", "README.zh-CN.md"].map((name) => path.join(root, name));
  for (const readme of readmes) {
    const text = await readText(readme);
    for (const skill of officialSkills) {
      if (!text.includes(`./skills/${skill}/SKILL.md`)) {
        recordError(`${relativeToRoot(readme)}: missing link to ${skill}`);
      }
    }
    for (const skill of removedWorkflowSkills) {
      if (text.includes(`./skills/${skill}/SKILL.md`)) {
        recordError(`${relativeToRoot(readme)}: must not link removed workflow skill ${skill}`);
      }
    }
  }
  reports.push("readme: official skill links checked");
}

async function validateBuildUniverAppLinks() {
  const skillFiles = await collectMarkdownFiles(path.join(skillsRoot, buildSkill));
  for (const skill of generatedIntegrationSkills) {
    skillFiles.push(...await collectMarkdownFiles(path.join(skillsRoot, skill)));
  }
  const docsFiles = await collectMarkdownFiles(path.join(root, "docs", "univer-office-suite"));
  const files = [path.join(root, "README.md"), path.join(root, "README.zh-CN.md"), ...skillFiles, ...docsFiles];
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;

  for (const file of files) {
    const text = await readText(file);
    for (const match of text.matchAll(linkPattern)) {
      const target = match[1].trim().replace(/^<|>$/g, "").split("#", 1)[0];
      if (!target || /^(?:https?:|mailto:|#)/i.test(target)) continue;
      if (!existsSync(path.resolve(path.dirname(file), decodeURIComponent(target)))) {
        recordError(`${relativeToRoot(file)}: broken local link ${JSON.stringify(match[1])}`);
      }
    }
  }

  reports.push(`links: ${files.length} repository markdown files checked`);
}

function isExplicitlyHistoricalOrNegative(line) {
  return /deprecated|historical|migration|stale|legacy|old|removed|obsolete|no longer|do not|not use|forbid|forbidden|avoid|禁止|不要|不得|旧|历史|迁移|已移除|废弃/i.test(line);
}

function lineMatchesExactToken(line, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^A-Za-z0-9-])${escaped}([^A-Za-z0-9-]|$)`, "i");
  return pattern.test(line);
}

async function validateStaleContractText() {
  const officialSkillMarkdownFiles = [];
  for (const skill of [buildSkill, ...sdkSkills, ...discoverySkills]) {
    officialSkillMarkdownFiles.push(...await collectMarkdownFiles(path.join(skillsRoot, skill)));
  }

  const contractFiles = [
    path.join(root, "README.md"),
    path.join(root, "README.zh-CN.md"),
    ...officialSkillMarkdownFiles,
    ...await collectMarkdownFiles(path.join(root, "docs", "univer-office-suite"))
  ];

  const forbiddenOldSkillNames = [
    ["dream-num", "univer-sdk-skills"].join("/"),
    "use-univer-cli",
    "univer-plan",
    "univer-tdd",
    "univer-spreadsheet-tdd",
    ...removedWorkflowSkills
  ];
  const staleCommandTokens = [
    "univer run",
    "pipe out",
    "pipe in",
    "univer config set experimental.sac true",
    "experimental.sac",
    "univer workspace",
    "univer sac rebuild",
    "<file.univer|file.unv>",
    "file.unv",
    ".unv"
  ];

  for (const file of contractFiles) {
    const text = await readText(file);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      const contextLine = [lines[index - 1] ?? "", line, lines[index + 1] ?? ""].join(" ");
      for (const token of forbiddenOldSkillNames) {
        if (lineMatchesExactToken(line, token) && !isExplicitlyHistoricalOrNegative(contextLine)) {
          recordError(`${relativeToRoot(file)}:${index + 1}: stale skill name "${token}" appears in current contract text`);
        }
      }

      for (const token of staleCommandTokens) {
        if (line.includes(token) && !isExplicitlyHistoricalOrNegative(contextLine)) {
          recordError(`${relativeToRoot(file)}:${index + 1}: stale command guidance "${token}" appears in current contract text`);
        }
      }
    });
  }

  const workflowLawTokens = [
    "SUCCESS CRITERIA FIRST",
    "PLAN SECOND",
    "ASSERTIONS THIRD",
    "MIGRATION SOURCE FOURTH",
    "RED - Write the Assertion First",
    "Verify RED",
    "GREEN - Implement",
    "NO MIGRATION PACK IMPLEMENTATION WITHOUT",
    "Load test-driven-univer-development",
    "Load writing-univer-plans",
    "Load executing-univer-plans"
  ];

  for (const file of contractFiles) {
    const text = await readText(file);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      const contextLine = [lines[index - 1] ?? "", line, lines[index + 1] ?? ""].join(" ");
      for (const token of workflowLawTokens) {
        if (line.includes(token) && !isExplicitlyHistoricalOrNegative(contextLine)) {
          recordError(`${relativeToRoot(file)}:${index + 1}: product skill must not mandate workflow law "${token}"`);
        }
      }
    });
  }

  reports.push(`stale-contract: ${contractFiles.length} markdown files checked`);
}

async function validateWorkspaceDiscoveryGuidance() {
  const skillFile = path.join(skillsRoot, "univer-workspace-cli", "SKILL.md");
  const readmes = ["README.md", "README.zh-CN.md"].map((name) => path.join(root, name));
  const skillText = await readText(skillFile);
  const corpus = [skillText, ...await Promise.all(readmes.map(readText))].join("\n");

  const requiredTokens = [
    "univer-workspace-cli config set-origin",
    "univer-workspace-cli skills get core",
    "univer-workspace-cli skills get core --full",
    "univer-workspace-cli skills get sheet",
    "univer-workspace-cli skills get doc",
    "univer-workspace-cli skills get slide",
    "Start every new task in a new Worktree",
    "Base and Board authoring are outside the current Workspace Skill surface"
  ];
  for (const token of requiredTokens) {
    if (!skillText.includes(token)) {
      recordError(`${relativeToRoot(skillFile)}: missing Workspace discovery token ${JSON.stringify(token)}`);
    }
  }

  const forbiddenTokens = [
    "config set workspace.origin",
    "https://workspace.univer.plus/",
    "univer-workspace-cli update",
    "univer-workspace-cli skills get base",
    "univer-workspace-cli skills get board",
    "Univerfile Link"
  ];
  for (const token of forbiddenTokens) {
    if (corpus.includes(token)) {
      recordError(`${relativeToRoot(skillFile)}: unsupported Workspace guidance ${JSON.stringify(token)}`);
    }
  }

  if (/\btrunk\b/iu.test(skillText) || /\.univer\b/iu.test(skillText)) {
    recordError(`${relativeToRoot(skillFile)}: Workspace discovery must not use local target semantics`);
  }

  reports.push("workspace-discovery: version-matched remote guidance checked");
}

async function walkFiles(dirPath, baseDir = dirPath) {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const filePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(filePath, baseDir));
      continue;
    }
    if (entry.isFile()) files.push(path.relative(baseDir, filePath));
  }
  return files.sort();
}

async function hashFile(filePath) {
  const content = await fs.readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function compareDirectories(sourceDir, targetDir) {
  const [sourceFiles, targetFiles] = await Promise.all([walkFiles(sourceDir), walkFiles(targetDir)]);
  const diffs = [];
  const allFiles = [...new Set([...sourceFiles, ...targetFiles])].sort();
  for (const relativeFile of allFiles) {
    if (!sourceFiles.includes(relativeFile)) {
      diffs.push(`extra ${relativeFile}`);
      continue;
    }
    if (!targetFiles.includes(relativeFile)) {
      diffs.push(`missing ${relativeFile}`);
      continue;
    }
    const [sourceHash, targetHash] = await Promise.all([
      hashFile(path.join(sourceDir, relativeFile)),
      hashFile(path.join(targetDir, relativeFile))
    ]);
    if (sourceHash !== targetHash) diffs.push(`changed ${relativeFile}`);
  }
  return diffs;
}

async function realpathOrNull(filePath) {
  try {
    return await fs.realpath(filePath);
  } catch {
    return null;
  }
}

async function validateExposureDirectory({ label, exposureRoot, failOnDrift, skills = officialSkills, sourceRoot = skillsRoot }) {
  if (!existsSync(exposureRoot)) {
    reports.push(`${label}: ${exposureRoot} not present`);
    return;
  }

  for (const skill of skills) {
    const canonicalDir = path.join(sourceRoot, skill);
    const exposedDir = path.join(exposureRoot, skill);
    if (!existsSync(exposedDir)) continue;

    const stat = await fs.lstat(exposedDir);
    const canonicalRealpath = await realpathOrNull(canonicalDir);
    const exposedRealpath = await realpathOrNull(exposedDir);
    if (stat.isSymbolicLink()) {
      if (canonicalRealpath !== exposedRealpath) {
        const message = `${label}: ${skill} symlink resolves to ${exposedRealpath ?? "unresolved"}, expected ${canonicalRealpath}`;
        recordDrift({ failOnDrift, message, skill });
      }
      continue;
    }

    if (!stat.isDirectory()) {
      const message = `${label}: ${skill} is neither symlink nor directory`;
      recordDrift({ failOnDrift, message, skill });
      continue;
    }

    const diffs = await compareDirectories(canonicalDir, exposedDir);
    if (diffs.length > 0) {
      const preview = diffs.slice(0, 5).join(", ");
      const suffix = diffs.length > 5 ? `, ... ${diffs.length - 5} more` : "";
      const message = `${label}: ${skill} diverges from canonical source (${preview}${suffix})`;
      recordDrift({ failOnDrift, message, skill });
    }
  }

  reports.push(`${label}: exposure drift checked`);
}

function withSyncCommand(message, skill) {
  const source = path.join(root, "skills", skill);
  const target = path.join(os.homedir(), ".codex", "skills", skill);
  return `${message}; explicit sync: rsync -a --delete "${source}/" "${target}/"`;
}

function getRepoRootArg() {
  const explicitArgIndex = process.argv.indexOf("--repo-root");
  if (explicitArgIndex !== -1 && process.argv[explicitArgIndex + 1]) {
    return path.resolve(process.argv[explicitArgIndex + 1]);
  }
  if (process.env.UNIVER_CLI_REPO_ROOT) return path.resolve(process.env.UNIVER_CLI_REPO_ROOT);
  const defaultParent = path.resolve(root, "..", "..");
  return existsSync(path.join(defaultParent, ".codex", "skills")) ? defaultParent : null;
}

async function validateDrift() {
  const repoRoot = getRepoRootArg();
  if (repoRoot) {
    await validateExposureDirectory({
      label: "repo-local .codex/skills",
      exposureRoot: path.join(repoRoot, ".codex", "skills"),
      failOnDrift: true,
      skills: discoverySkills,
      sourceRoot: path.join(repoRoot, "packages", "skills", "skills")
    });
  } else {
    reports.push("repo-local .codex/skills: skipped; pass --repo-root to check repository exposure");
  }

  await validateExposureDirectory({
    label: "user-home ~/.codex/skills",
    exposureRoot: path.join(os.homedir(), ".codex", "skills"),
    failOnDrift: false
  });
}

async function main() {
  await validateSkillStructure();
  await validateReadmes();
  await validateBuildUniverAppLinks();
  await validateStaleContractText();
  await validateWorkspaceDiscoveryGuidance();
  await validateDrift();

  for (const report of reports) console.log(`ok: ${report}`);

  if (warnings.length > 0) {
    console.warn("\nAdvisory warnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (errors.length > 0) {
    console.error("\nValidation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nSkill package validation passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

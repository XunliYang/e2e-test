#!/usr/bin/env node
/**
 * Build codegen plan from config + parsed CSV cases.
 * Usage: node build-codegen-plan.mjs [config-path]
 * Cases are grouped by their per-row language_profile (CSV column wins over
 * config-level language_profile).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveOutputPath, PROFILE_OUTPUT } from './target-repo-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const validateScript = join(__dirname, 'validate-config.mjs');
const parseScript = join(__dirname, 'parse-test-cases.mjs');

const explicit = process.argv[2];
const vArgs = explicit ? [validateScript, explicit] : [validateScript];
const vProc = spawnSync(process.execPath, vArgs, { encoding: 'utf8' });
if (vProc.status !== 0 && vProc.status !== 2) {
  console.error(vProc.stderr || vProc.stdout);
  process.exit(vProc.status ?? 1);
}

const config = JSON.parse(vProc.stdout);

const pArgs = [parseScript, config.input.cases_csv];
if (config.input.case_ids?.length) {
  pArgs.push('--ids', config.input.case_ids.join(','));
}
if (config.input.priority_filter?.length) {
  pArgs.push('--priority', config.input.priority_filter.join(','));
}
const pProc = spawnSync(process.execPath, pArgs, { encoding: 'utf8' });
if (pProc.status !== 0) {
  console.error(pProc.stderr || pProc.stdout);
  process.exit(pProc.status ?? 1);
}

let parsed;
try {
  parsed = JSON.parse(pProc.stdout);
} catch {
  console.error('Failed to parse test cases');
  process.exit(1);
}

const targetRepo = config.target_repo ?? 'generic';

const RUN_HINTS = {
  python: 'uv run pytest {layer} -q -k "{case_id_underscore}"',
  java: 'mvn test -Dtest={case_id}Test',
  js: 'npx playwright test --grep "{case_id}"',
  shell: 'bats {output_file}',
};

const plan = {
  config_path: config.config_path,
  project_root: config.project_root,
  target_repo: targetRepo,
  language_profile: config.language_profile,
  output: config.output,
  env: config.env,
  options: config.options,
  cases: [],
  skipped: parsed.skipped,
  missing: config.missing,
  profile_defaults: PROFILE_OUTPUT,
  run_hints: RUN_HINTS,
};

for (const c of parsed.cases) {
  const pathResult = resolveOutputPath(config, c);
  if (pathResult.error) {
    plan.skipped.push({ case_id: c.case_id, reason: pathResult.error, name: c.name });
    continue;
  }
  plan.cases.push({
    ...c,
    output_file: pathResult.output_file,
    test_layer: pathResult.test_layer,
    run_hint: substituteRunHint(RUN_HINTS[c.language_profile], c, pathResult),
  });
}

function substituteRunHint(hint, c, pathResult) {
  if (!hint) return '';
  return hint
    .replace(/\{layer\}/g, pathResult.test_layer ?? '')
    .replace(/\{output_file\}/g, pathResult.output_file ?? '')
    .replace(/\{case_id\}/g, c.case_id)
    .replace(/\{case_id_underscore\}/g, c.case_id.replace(/-/g, '_'));
}

console.log(JSON.stringify(plan, null, 2));
process.exit(plan.cases.length ? 0 : 2);

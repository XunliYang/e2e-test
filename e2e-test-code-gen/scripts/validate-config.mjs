#!/usr/bin/env node
/**
 * Validate e2e-code-gen.config.json (openan).
 * Usage: node validate-config.mjs [config-path]
 * Exit codes: 0 = ok; 1 = fatal error; 2 = validation failed (JSON printed).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGE_PROFILES } from './csv-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, '..');

const CONFIG_CANDIDATES = ['e2e-code-gen.config.json', '.e2e-code-gen/config.json'];

function findConfig(explicit) {
  if (explicit) return resolve(process.cwd(), explicit);
  for (const c of CONFIG_CANDIDATES) {
    const p = resolve(process.cwd(), c);
    if (existsSync(p)) return p;
  }
  return null;
}

function fail(msg) {
  console.error(`[e2e-code-gen] ERROR: ${msg}`);
  process.exit(1);
}

/** Detect the repo's dominant language from project_root markers. */
function detectLanguageProfile(projectRoot) {
  const has = (p) => existsSync(join(projectRoot, p));
  if (has('pyproject.toml') || has('setup.py') || has('requirements.txt')) return 'python';
  if (has('pom.xml') || has('build.gradle') || has('build.gradle.kts')) return 'java';
  if (has('package.json')) return 'js';
  try {
    if (has('tests') && readdirSync(join(projectRoot, 'tests')).some((f) => f.endsWith('.bats')))
      return 'shell';
  } catch {
    /* ignore */
  }
  if (has('Makefile') || has('install.sh')) return 'shell';
  return null;
}

function validate(configPath) {
  if (!configPath || !existsSync(configPath)) {
    fail('Config not found. Copy assets/e2e-code-gen.config.example.json and adjust.');
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    fail(`Invalid JSON: ${e.message}`);
  }

  if (raw.version !== '1') fail('version must be "1"');

  const base = isAbsolute(raw.project_root ?? '.')
    ? raw.project_root
    : resolve(dirname(configPath), raw.project_root ?? '.');

  const input = raw.input ?? {};
  const csv = input.cases_csv;
  if (!csv || typeof csv !== 'string') fail('input.cases_csv is required');

  const csvAbs = isAbsolute(csv)
    ? csv
    : [
        resolve(process.cwd(), csv),
        resolve(dirname(configPath), csv),
        resolve(SKILL_ROOT, csv),
        resolve(base, csv),
      ].find((p) => existsSync(p)) ?? resolve(base, csv);
  const csvExists = existsSync(csvAbs);

  // target_repo: openan owner/repo, e.g. "openan/registry-center"; informational.
  const targetRepo = typeof raw.target_repo === 'string' && raw.target_repo.includes('/')
    ? raw.target_repo
    : 'generic';

  let profile = raw.language_profile ?? 'auto';
  if (profile !== 'auto' && !LANGUAGE_PROFILES.includes(profile)) {
    fail(`language_profile must be one of: auto, ${LANGUAGE_PROFILES.join(', ')}`);
  }
  if (profile === 'auto') {
    profile = detectLanguageProfile(base) ?? 'unknown';
  }

  const missing = [
    ...(!csvExists ? [{ type: 'csv', path: csvAbs }] : []),
    ...(profile === 'unknown'
      ? [{ type: 'language_profile', message: 'auto detect failed; set language_profile explicitly (python/java/js/shell)' }]
      : []),
  ];

  const options = raw.options ?? {};

  return {
    ok: csvExists && profile !== 'unknown',
    config_path: configPath,
    project_root: base,
    target_repo: targetRepo,
    input: {
      cases_csv: csvAbs,
      case_ids: input.case_ids ?? [],
      priority_filter: input.priority_filter ?? [],
    },
    language_profile: {
      configured: raw.language_profile ?? 'auto',
      resolved: profile,
    },
    output: {
      dir: raw.output?.dir
        ? isAbsolute(raw.output.dir)
          ? raw.output.dir
          : resolve(base, raw.output.dir)
        : null, // null = use per-profile default from target-repo-utils.mjs
      file_pattern: raw.output?.file_pattern ?? null,
    },
    env: raw.env ?? {},
    options: {
      overwrite: options.overwrite === true,
      verify_command: options.verify_command ?? '',
    },
    missing,
    skill_root: SKILL_ROOT,
    scripts: {
      parse_test_cases: join(SKILL_ROOT, 'scripts', 'parse-test-cases.mjs'),
      build_codegen_plan: join(SKILL_ROOT, 'scripts', 'build-codegen-plan.mjs'),
      run: join(SKILL_ROOT, 'scripts', 'run.mjs'),
    },
    references: {
      csv_guide: join(SKILL_ROOT, 'references', '评审CSV生成指导.md'),
      code_gen_guide: join(SKILL_ROOT, 'references', '代码生成指导.md'),
      orchestration_guide: join(SKILL_ROOT, 'references', '测试包编排设计指导.md'),
    },
  };
}

const explicit = process.argv[2];
const result = validate(findConfig(explicit));
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 2);

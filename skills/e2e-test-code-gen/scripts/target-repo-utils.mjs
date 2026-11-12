#!/usr/bin/env node
/**
 * Target repo path resolution utilities (openan multi-repo).
 * Output conventions follow each language profile's directory layout.
 */
import { join } from 'node:path';

/** Default output conventions per language_profile. */
export const PROFILE_OUTPUT = {
  python: {
    base_dir: 'tests/e2e',
    file_pattern: 'test_{module}_{scenario}.py',
    test_layer: 'tests/e2e',
  },
  java: {
    base_dir: 'src/test/java',
    file_pattern: '{case_id}Test.java',
    test_layer: 'src/test/java',
  },
  js: {
    base_dir: 'tests/e2e',
    file_pattern: '{module}.{scenario}.spec.ts',
    test_layer: 'tests/e2e',
  },
  shell: {
    base_dir: 'tests',
    file_pattern: '{module}.bats',
    test_layer: 'tests',
  },
};

export function toKebabCase(name) {
  if (!name) return '';
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
}

export function toSnakeCase(name) {
  if (!name) return '';
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

/** module column (e.g. registry-center) -> safe token for file naming. */
export function moduleToken(module, fallback = 'feature') {
  const s = toSnakeCase(module);
  return s || fallback;
}

export function scenarioToken(scenario) {
  const s = toSnakeCase(scenario || 'generic');
  return s || 'generic';
}

function substitute(pattern, tokens) {
  return pattern
    .replace(/\{case_id\}/g, tokens.case_id)
    .replace(/\{case_id_slug\}/g, tokens.case_id_slug)
    .replace(/\{module\}/g, tokens.module)
    .replace(/\{scenario\}/g, tokens.scenario);
}

/**
 * Resolve the output file (repo-relative, forward slashes) for one case.
 * config.output.dir / config.output.file_pattern override profile defaults.
 */
export function resolveOutputPath(config, parsedCase) {
  const profile = parsedCase.language_profile;
  const defaults = PROFILE_OUTPUT[profile];
  if (!defaults) {
    return { output_file: null, error: `unknown language_profile: ${profile}` };
  }

  const tokens = {
    case_id: parsedCase.case_id,
    case_id_slug: parsedCase.case_id_slug,
    module: moduleToken(parsedCase.module),
    scenario: scenarioToken(parsedCase.scenario),
  };

  const baseDir = config.output?.dir ?? defaults.base_dir;
  const pattern = config.output?.file_pattern ?? defaults.file_pattern;
  const file = substitute(pattern, tokens);

  return {
    output_file: join(baseDir, file).replace(/\\/g, '/'),
    base_dir: baseDir,
    profile,
    test_layer: defaults.test_layer,
  };
}

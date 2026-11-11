#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const configPath = process.argv[2];
const validate = join(scriptsDir, 'validate-config.mjs');
const build = join(scriptsDir, 'build-codegen-plan.mjs');

const vArgs = configPath ? [validate, configPath] : [validate];
const v = spawnSync(process.execPath, vArgs, { encoding: 'utf8', stdio: 'pipe' });
process.stdout.write(v.stdout ?? '');
process.stderr.write(v.stderr ?? '');
if (v.status !== 0 && v.status !== 2) process.exit(v.status ?? 1);

const bArgs = configPath ? [build, configPath] : [build];
const b = spawnSync(process.execPath, bArgs, { encoding: 'utf8', stdio: 'inherit' });
process.exit(b.status ?? 1);

#!/usr/bin/env node
/**
 * Parse openan 12-column test case CSV and output codegen input JSON.
 * Usage: node parse-test-cases.mjs <csv-path> [--ids id1,id2] [--priority P0,P1]
 * Exit codes: 0 = cases found; 1 = usage/parse error; 2 = zero cases after filters.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseCsv,
  rowsToObjects,
  detectCsvFormat,
  normalizeRow,
  inferEntryType,
  shouldIncludeRow,
  isValidLanguageProfile,
  FORMAT_OPENAN,
  CASE_HEADERS,
} from './csv-utils.mjs';

function parseArgs(argv) {
  const positional = [];
  let ids = [];
  let priority = [];
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--ids') ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === '--priority')
      priority = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else positional.push(argv[i]);
  }
  return { csvPath: positional[0], ids, priority };
}

const { csvPath, ids, priority } = parseArgs(process.argv);
if (!csvPath) {
  console.error('Usage: node parse-test-cases.mjs <csv-path> [--ids id1,id2] [--priority P0,P1]');
  process.exit(1);
}

const abs = resolve(process.cwd(), csvPath);
if (!existsSync(abs)) {
  console.error(`[e2e-code-gen] CSV not found: ${abs}`);
  process.exit(1);
}

const rawRows = rowsToObjects(parseCsv(readFileSync(abs, 'utf8')));
const headers = rawRows.length ? Object.keys(rawRows[0]) : [];
const format = detectCsvFormat(headers);

if (format !== FORMAT_OPENAN) {
  console.error(
    `[e2e-code-gen] ERROR: CSV must use the openan 12-column header (BOM tolerated). Expected:\n  ${CASE_HEADERS.join(',')}`
  );
  process.exit(1);
}

const cases = [];
const skipped = [];

for (const raw of rawRows) {
  const n = normalizeRow(raw);
  const caseId = n.case_id;
  if (!caseId) continue;
  if (ids.length && !ids.includes(caseId)) continue;
  if (priority.length && !priority.includes(n.priority)) continue;

  if (!shouldIncludeRow(n)) {
    skipped.push({ case_id: caseId, reason: 'type 不在可生成范围（FIT/DFT/DFD/DFS/DFR/DFP/DFNS/DFC）', name: n.name });
    continue;
  }
  if (!isValidLanguageProfile(n.language_profile)) {
    skipped.push({ case_id: caseId, reason: `language_profile 非法: "${n.language_profile || '(空)'}"`, name: n.name });
    continue;
  }

  cases.push({
    case_id: caseId,
    case_id_slug: n.case_id_slug,
    type: n.type,
    module: n.module,
    name: n.name,
    priority: n.priority,
    language_profile: n.language_profile,
    component_deps: n.component_deps,
    protocol_primitive: n.protocol_primitive,
    milestone: n.milestone,
    entry_type: inferEntryType(n),
    scenario: n.scenario,
    notes: n.notes,
    notes_text: n.notes_text,
    preconditions: n.preconditions,
    steps: n.steps,
    expected: n.expected,
    csv_format: format,
  });
}

console.log(
  JSON.stringify(
    {
      csv_path: abs,
      csv_format: format,
      total_rows: rawRows.length,
      case_count: cases.length,
      skipped_count: skipped.length,
      profiles: [...new Set(cases.map((c) => c.language_profile))],
      cases,
      skipped,
    },
    null,
    2
  )
);

process.exit(cases.length ? 0 : 2);

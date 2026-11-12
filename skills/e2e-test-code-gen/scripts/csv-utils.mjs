#!/usr/bin/env node
/**
 * CSV parser for the openan 12-column test case CSV.
 * Header matches ../test-cases-generator/templates/case-template.csv.
 * Reads the file as UTF-8 (BOM, if present, is stripped by callers or
 * tolerated here since the first header key is trimmed).
 */
export const FORMAT_OPENAN = 'openan';

export const CASE_HEADERS = [
  'case_id',
  'type',
  'module',
  'title',
  'precondition',
  'steps',
  'expected_result',
  'priority',
  'language_profile',
  'component_deps',
  'protocol_primitive',
  'notes',
];

export const LANGUAGE_PROFILES = ['python', 'java', 'js', 'shell'];

export const DFX_TYPES = ['DFT', 'DFD', 'DFS', 'DFR', 'DFP', 'DFNS', 'DFC'];

export function detectCsvFormat(headers) {
  const h = headers.map((x) => x.replace(/^\uFEFF/, '').trim());
  const ok = h.length === CASE_HEADERS.length && CASE_HEADERS.every((col, i) => h[i] === col);
  return ok ? FORMAT_OPENAN : 'unknown';
}

export function normalizeCaseId(raw) {
  return (raw || '').trim();
}

export function extractCaseIdSlug(caseId) {
  return (caseId || '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

export function inferOpenanScenario(row) {
  // body = 用例主体（title/steps/expected/notes）；all 含 precondition。
  // 命中顺序从上到下，越具体的场景越靠前，避免「已注册」等 precondition 字样误命中。
  const body = [row['title'], row['steps'], row['expected_result'], row['notes']].join(' ');
  const all = `${body} ${row['precondition']}`;

  if (/任务下发|Task-T/i.test(all)) return 'task_dispatch';
  if (/协商|Negotiation-T|Authorization-T/i.test(all)) return 'protocol_negotiation';
  if (/重启/.test(all)) return 'service_restart';
  if (/边界|长度上限/.test(body)) return 'boundary';
  if (/并发|幂等|重复/.test(body)) return 'concurrency';
  if (/PUT |DELETE |更新|注销/.test(body)) return 'agent_update_delete';
  if (/非法|拒绝|400|422|404|不存在/.test(body)) return 'invalid_input';
  if (/docker compose up|启动服务|健康检查|health/i.test(body)) return 'service_startup';
  if (/POST \/v1\/agents/i.test(body) || /注册\s*Agent/i.test(body)) return 'agent_register';
  if (/GET |查询|分页|列表/.test(body)) return 'agent_query';
  return 'generic';
}

export function normalizeRow(row) {
  const caseId = normalizeCaseId(row['case_id']);
  return {
    _raw: row,
    case_id: caseId,
    case_id_slug: extractCaseIdSlug(caseId),
    type: (row['type'] || '').trim(),
    module: (row['module'] || '').trim(),
    name: (row['title'] || '').trim(),
    priority: (row['priority'] || '').trim(),
    language_profile: (row['language_profile'] || '').trim(),
    component_deps: (row['component_deps'] || '').trim(),
    protocol_primitive: (row['protocol_primitive'] || '').trim(),
    preconditions: (row['precondition'] || '').trim(),
    steps: (row['steps'] || '').trim(),
    expected: (row['expected_result'] || '').trim(),
    notes_text: (row['notes'] || '').trim(),
    notes: parseNotes(row['notes'] || ''),
    milestone: (parseNotes(row['notes'] || '')['里程碑'] || '').trim(),
    scenario: inferOpenanScenario(row),
  };
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\r' && text[i + 1] === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 2;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] ?? '').trim();
      });
      return obj;
    });
}

export function parseNotes(notes) {
  const out = {};
  for (const part of (notes || '').split(/[;；]/)) {
    const [k, ...rest] = part.split(/[:：]/);
    if (k && rest.length) out[k.trim()] = rest.join(':').trim();
  }
  return out;
}

export function inferEntryType(row) {
  const steps = row.steps || row['steps'] || '';
  const primitive = row.protocol_primitive || row['protocol_primitive'] || '';
  if (primitive && primitive !== 'none') return 'A2A-T';
  if (/控制台|页面|登录|浏览器|UI/i.test(steps)) return 'UI';
  if (/docker compose|容器|服务启动/i.test(steps)) return 'Compose';
  if (/api|http|curl|rest|GET |POST |PUT |DELETE /i.test(steps)) return 'API';
  return 'API';
}

export function shouldIncludeRow(normalized) {
  const type = normalized.type || '';
  if (!type) return true;
  return type === 'FIT' || DFX_TYPES.includes(type);
}

export function isValidLanguageProfile(value) {
  return LANGUAGE_PROFILES.includes((value || '').trim());
}

#!/usr/bin/env node
/**
 * CSV parser for the openan test case CSV (16 columns: official 15 + component_deps).
 * Header matches ../test-cases-generator/templates/case-template.csv
 * (openan-itest docs/templates/testcases-template.csv).
 * Orchestration keys (language_profile / protocol_primitive /
 * 执行策略 / 环境 / DFX类型) are carried as `key:value` pairs inside the 备注 column.
 * Reads the file as UTF-8 (BOM, if present, is stripped by callers or
 * tolerated here since the first header key is trimmed).
 */
export const FORMAT_OPENAN = 'openan';

export const CASE_HEADERS = [
  '里程碑',
  '用例名称',
  '用例编号',
  '模块',
  'component_deps',
  '需求链接',
  '用例类型',
  '优先级',
  '前置条件',
  '步骤描述',
  '预期结果',
  '可自动化',
  '对应自动化用例',
  '开发负责人',
  '测试负责人',
  '备注',
];

export const LANGUAGE_PROFILES = ['python', 'java', 'js', 'shell'];

export const DFX_TYPES = ['DFT', 'DFD', 'DFS', 'DFR', 'DFP', 'DFNS', 'DFC'];

export const FIT_TYPES = ['功能测试', '异常测试', '协议测试'];

export const EXECUTION_STRATEGIES = ['smoke', 'full', 'slow'];

/** 用例类型 → DFX 简写映射（DFX 行另以备注 DFX类型 键为准）。 */
const DFX_TYPE_MAP = {
  可测试性测试: 'DFT',
  可诊断性测试: 'DFD',
  可运维性测试: 'DFS',
  可靠性测试: 'DFR',
  稳定性测试: 'DFR',
  性能测试: 'DFP',
  压力测试: 'DFP',
  安全测试: 'DFNS',
  兼容性测试: 'DFC',
};

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
  // body = 用例主体（用例名称/步骤描述/预期结果/备注）；all 含 前置条件。
  // 命中顺序从上到下，越具体的场景越靠前，避免「已注册」等 precondition 字样误命中。
  const body = [row['用例名称'], row['步骤描述'], row['预期结果'], row['备注']].join(' ');
  const all = `${body} ${row['前置条件']}`;

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

/**
 * 归一化一行 CSV。内部字段名保持下游兼容（case_id/type/module/...），
 * 但取值来自 16 列中文表头（openan 官方 15 列 + component_deps）；编排键从「备注」列解析：
 * language_profile / protocol_primitive / 执行策略 / 环境 / DFX类型。
 * type 派生规则：FIT 类型（功能/异常/协议测试）→ 'FIT'；
 * DFX 行优先取备注 DFX类型 键（大写），否则按「用例类型」映射，否则原值。
 */
export function normalizeRow(row) {
  const notes = parseNotes(row['备注'] || '');
  const caseType = (row['用例类型'] || '').trim();
  const dfxKey = (notes['DFX类型'] || '').trim().toUpperCase();
  let type = caseType;
  if (FIT_TYPES.includes(caseType)) type = 'FIT';
  else if (DFX_TYPES.includes(dfxKey)) type = dfxKey;
  else if (DFX_TYPE_MAP[caseType]) type = DFX_TYPE_MAP[caseType];

  const caseId = normalizeCaseId(row['用例编号']);
  return {
    _raw: row,
    case_id: caseId,
    case_id_slug: extractCaseIdSlug(caseId),
    type,
    case_type: caseType,
    module: (row['模块'] || '').trim(),
    name: (row['用例名称'] || '').trim(),
    priority: (row['优先级'] || '').trim(),
    milestone: (row['里程碑'] || '').trim(),
    requirement_link: (row['需求链接'] || '').trim(),
    automatable: (row['可自动化'] || '').trim(),
    auto_case_ref: (row['对应自动化用例'] || '').trim(),
    language_profile: (notes['language_profile'] || '').trim(),
    component_deps: (row['component_deps'] || '').trim(),
    protocol_primitive: (notes['protocol_primitive'] || '').trim(),
    execution_strategy: (notes['执行策略'] || '').trim(),
    environment: (notes['环境'] || '').trim(),
    dfx_type: dfxKey,
    preconditions: (row['前置条件'] || '').trim(),
    steps: (row['步骤描述'] || '').trim(),
    expected: (row['预期结果'] || '').trim(),
    notes_text: (row['备注'] || '').trim(),
    notes,
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

/** 解析「备注」列中的 `键:值` 对；多个键用 `；`/`;` 分隔。 */
export function parseNotes(notes) {
  const out = {};
  for (const part of (notes || '').split(/[;；]/)) {
    const [k, ...rest] = part.split(/[:：]/);
    if (k && rest.length) out[k.trim()] = rest.join(':').trim();
  }
  return out;
}

export function inferEntryType(row) {
  const steps = row.steps || row['步骤描述'] || '';
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

export function isValidExecutionStrategy(value) {
  return EXECUTION_STRATEGIES.includes((value || '').trim());
}

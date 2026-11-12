#!/usr/bin/env node
/**
 * ensure-bom.cjs —— 确保 CSV 文件以 UTF-8 BOM（EF BB BF）开头。
 *
 * 背景：Excel/WPS 直接打开无 BOM 的 UTF-8 CSV 时，按系统 ANSI 代码页（中文
 * Windows 为 GBK）解码，中文会显示为乱码；带 BOM 则按 UTF-8 解码，显示正常。
 *
 * 行为：
 *   - 已有 BOM：不改动（幂等，可重复执行）
 *   - 无 BOM 且内容为合法 UTF-8：写入 BOM
 *   - 非 UTF-8（如 GBK）：报错退出，拒绝处理（加 BOM 只会更乱）
 *
 * 用法：
 *   node ensure-bom.cjs <csv路径> [更多csv路径...]
 *
 * 退出码：全部成功为 0；任一失败为 1。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

function ensureBom(file) {
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch (err) {
    return { ok: false, changed: false, message: `无法读取文件：${err.message}` };
  }

  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return { ok: true, changed: false, message: '已有 BOM，无需处理' };
  }

  // 非 UTF-8 文件（如已按 GBK 保存）加 BOM 只会更乱，拒绝处理
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return {
      ok: false,
      changed: false,
      message: '文件不是合法 UTF-8（可能是 GBK/ANSI 编码），请先转换编码再加 BOM',
    };
  }

  fs.writeFileSync(file, Buffer.concat([BOM, buf]));
  return { ok: true, changed: true, message: '已写入 UTF-8 BOM' };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('用法: node ensure-bom.cjs <csv路径> [更多csv路径...]');
    process.exitCode = 1;
    return;
  }

  let failed = false;
  for (const arg of args) {
    const file = path.resolve(arg);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      failed = true;
      console.error(`[FAIL] ${arg}：文件不存在或不是普通文件`);
      continue;
    }
    const result = ensureBom(file);
    if (!result.ok) failed = true;
    console.log(`[${result.ok ? 'OK' : 'FAIL'}] ${arg}：${result.message}`);
  }
  if (failed) process.exitCode = 1;
}

main();

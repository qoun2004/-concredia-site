#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Concredia × Conga × 黃建凱  n8n Workflow 一鍵設定工具       ║
 * ║  使用方式：在終端機執行 node setup.js                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const fs   = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const dir = __dirname;
const FILES = [
  'n8n_workflow_01_話題情報收集.json',
  'n8n_workflow_02_AI草稿生成.json',
  'n8n_workflow_03_成效數據回收.json',
];

function replaceAll(str, search, replace) {
  return str.split(search).join(replace);
}

function colorize(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}
const green  = t => colorize(t, '32');
const yellow = t => colorize(t, '33');
const cyan   = t => colorize(t, '36');
const bold   = t => colorize(t, '1');
const dim    = t => colorize(t, '2');

async function main() {
  console.log('\n' + bold('═══════════════════════════════════════════════════════'));
  console.log(bold('  Concredia × Conga × 黃建凱  n8n 自動化設定工具'));
  console.log(bold('═══════════════════════════════════════════════════════'));
  console.log(dim('  填入以下資訊後，腳本會自動寫入全部 3 個 Workflow JSON\n'));

  // ── 1. Notion Credential ID ────────────────────────────────────────────────
  console.log(cyan('【1/4】Notion 憑證 ID'));
  console.log(dim('  → 在 n8n 左側 Credentials 頁面建立 Notion API 憑證後，'));
  console.log(dim('    從瀏覽器網址列取得 ID（/credentials/edit/XXXXXX 的 XXXXXX 部分）\n'));
  const notionCredId = (await ask('  請貼上 Notion Credential ID：')).trim();

  // ── 2. Notion Database ID ──────────────────────────────────────────────────
  console.log('\n' + cyan('【2/4】Notion 內容日曆 資料庫 ID'));
  console.log(dim('  → 進入 Notion 內容日曆頁面，從網址複製 32 碼英數字'));
  console.log(dim('    格式：https://www.notion.so/你的工作區/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=...\n'));
  const notionDbId = (await ask('  請貼上 Database ID（32碼）：')).trim();

  // ── 3. Claude API Key ──────────────────────────────────────────────────────
  console.log('\n' + cyan('【3/4】Claude API Key'));
  console.log(dim('  → 已有 sk-ant-... 開頭的金鑰，直接貼上即可\n'));
  const claudeKey = (await ask('  請貼上 Claude API Key：')).trim();

  // ── 4. IG Access Token (optional) ─────────────────────────────────────────
  console.log('\n' + cyan('【4/4】Instagram Graph API Token（選填）'));
  console.log(dim('  → 用於 Workflow 03 抓取 IG 貼文成效數據'));
  console.log(dim('    若尚未申請，直接按 Enter 跳過，之後可再補填\n'));
  const igToken = (await ask('  請貼上 IG Access Token（或按 Enter 跳過）：')).trim();

  rl.close();

  // ── Validate inputs ─────────────────────────────────────────────────────────
  const errors = [];
  if (!notionCredId) errors.push('Notion Credential ID 不能為空');
  if (!notionDbId || notionDbId.replace(/-/g, '').length < 32) errors.push('Notion Database ID 格式不正確（需要 32 碼）');
  if (!claudeKey || !claudeKey.startsWith('sk-')) errors.push('Claude API Key 格式不正確（應以 sk- 開頭）');

  if (errors.length > 0) {
    console.log('\n' + colorize('✗ 輸入錯誤，請重新執行：', '31'));
    errors.forEach(e => console.log('  • ' + e));
    process.exit(1);
  }

  // ── Apply replacements ──────────────────────────────────────────────────────
  console.log('\n' + bold('正在寫入 Workflow JSON 檔案...'));
  let successCount = 0;

  for (const filename of FILES) {
    const filepath = path.join(dir, filename);
    if (!fs.existsSync(filepath)) {
      console.log(yellow(`  ⚠ 找不到 ${filename}，跳過`));
      continue;
    }

    let content = fs.readFileSync(filepath, 'utf8');
    content = replaceAll(content, 'YOUR_NOTION_CREDENTIAL_ID', notionCredId);
    content = replaceAll(content, 'YOUR_CONTENT_CALENDAR_DATABASE_ID', notionDbId);
    content = replaceAll(content, 'YOUR_CLAUDE_API_KEY', claudeKey);

    if (igToken) {
      content = replaceAll(content, 'YOUR_IG_ACCESS_TOKEN', igToken);
    }

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(green(`  ✓ ${filename}`));
    successCount++;
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + bold('═══════════════════════════════════════════════════════'));
  console.log(green(`✓ 完成！已更新 ${successCount} 個 Workflow 檔案`));
  if (!igToken) {
    console.log(yellow('  ⓘ IG Access Token 尚未填入，Workflow 03 的成效數據功能暫時停用'));
    console.log(yellow('    待申請後，在 n8n 的 Workflow 03 中手動更新 URL 裡的 token 即可'));
  }
  console.log('\n' + bold('下一步：'));
  console.log('  1. 打開 n8n，點擊「+」→「Import from file」');
  console.log('  2. 依序匯入這 3 個 JSON 檔案（已填入金鑰，直接可用）');
  console.log('  3. 每個 Workflow 點擊右上角「Active」開關啟用');
  console.log(bold('═══════════════════════════════════════════════════════\n'));
}

main().catch(err => {
  console.error('\n錯誤：', err.message);
  rl.close();
  process.exit(1);
});

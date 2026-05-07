/**
 * fetch-airtable.js
 * Concredia.Lab · SSG 資料抓取腳本
 *
 * 用法：node scripts/fetch-airtable.js
 * 輸出：_data/products.json
 *
 * Netlify Build Command 設定為：
 *   node scripts/fetch-airtable.js && echo "資料抓取完成"
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── 設定 ──────────────────────────────────────────
const TOKEN    = process.env.AIRTABLE_TOKEN
              || '';
const BASE_ID  = process.env.AIRTABLE_BASE_ID  || 'app7TEyzrUHAXOscY';
const TABLE    = process.env.AIRTABLE_TABLE    || 'Concredia.Lab';
const OUT_DIR  = path.join(__dirname, '..', '_data');
const OUT_FILE = path.join(OUT_DIR, 'products.json');

// Airtable 欄位名稱對應
const FIELDS = {
  sku:      'SKU產品編號',
  name:     '作品名稱',
  category: '類別',
  material: '材料',
  method:   '工法',
  func:     '功能',
  suitable: '適合',
  spec:     '規格公分（長Ｘ寬Ｘ高）',
  weight:   '重量（克）',
  stock:    '庫存',
  images:   'AI圖',
};
// ──────────────────────────────────────────────────

/** 簡易 HTTPS GET */
function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch(e) { reject(new Error(`JSON parse 失敗: ${body.slice(0,200)}`)); }
      });
    });
    req.on('error', reject);
  });
}

/** 從 Airtable 抓全部記錄（自動分頁） */
async function fetchAll() {
  const fieldValues = Object.values(FIELDS);
  let records = [];
  let offset  = null;

  do {
    const params = new URLSearchParams();
    fieldValues.forEach(f => params.append('fields[]', f));
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?${params}`;
    console.log(`  抓取中${offset ? '（分頁）' : ''}... ${url.slice(0, 80)}`);

    const { status, data } = await httpsGet(url, {
      Authorization: `Bearer ${TOKEN}`,
    });

    if (status !== 200) {
      throw new Error(`Airtable API 回傳 ${status}: ${JSON.stringify(data).slice(0,300)}`);
    }

    records = records.concat(data.records || []);
    offset  = data.offset || null;
    console.log(`  已取得 ${records.length} 筆`);

  } while (offset);

  return records;
}

/** 解析單筆 record → 乾淨的物件 */
function parseRecord(record) {
  const f = record.fields;
  const F = FIELDS;

  // 附件欄位：取各種尺寸的圖片 URL
  const rawImgs = f[F.images] || [];
  const images  = rawImgs.map(att => ({
    id:       att.id,
    url:      att.url,
    filename: att.filename,
    width:    att.width,
    height:   att.height,
    thumb_sm: att.thumbnails?.small?.url  || att.url,
    thumb_lg: att.thumbnails?.large?.url  || att.url,
    thumb_xl: att.thumbnails?.full?.url   || att.url,
  }));

  // 庫存狀態標準化
  const stockRaw = (f[F.stock] || '').toString().trim();
  const stockStatus =
    /有|in.?stock|available/i.test(stockRaw) ? 'available' :
    /訂|order|預/i.test(stockRaw)            ? 'order'     :
    /無|sold|out/i.test(stockRaw)            ? 'sold'      : 'unknown';

  // 系列判斷
  const sku = (f[F.sku] || '').toString();
  const cat = (f[F.category] || '').toString();
  const series =
    /FL/i.test(sku) || /流構/i.test(cat) ? '流構系列' :
    /RM/i.test(sku) || /標準/i.test(cat) ? '標準系列' :
    /CM/i.test(sku) || /客製/i.test(cat) ? '客製系列' :
    /AW/i.test(sku) || /畫作/i.test(cat) ? '畫作系列' :
    cat || '其他';

  return {
    id:          record.id,
    sku:         f[F.sku]      || '',
    name:        f[F.name]     || '未命名作品',
    series,
    category:    f[F.category] || '',
    material:    f[F.material] || '',
    method:      f[F.method]   || '',
    func:        f[F.func]     || '',
    suitable:    f[F.suitable] || '',
    spec:        f[F.spec]     || '',
    weight:      f[F.weight]   || '',
    stockRaw,
    stockStatus,
    images,
    mainImg:     images[0]?.thumb_lg || '',
    mainImgFull: images[0]?.thumb_xl || '',
  };
}

/** 主程式 */
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  Concredia.Lab · Airtable SSG 資料抓取   ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`  Base:  ${BASE_ID}`);
  console.log(`  Table: ${TABLE}`);
  console.log('');

  try {
    // 1. 抓資料
    const records  = await fetchAll();
    const products = records.map(parseRecord);

    console.log(`\n✅ 共取得 ${products.length} 件作品`);

    // 2. 統計
    const stats = {
      total:     products.length,
      available: products.filter(p => p.stockStatus === 'available').length,
      order:     products.filter(p => p.stockStatus === 'order').length,
      sold:      products.filter(p => p.stockStatus === 'sold').length,
      withPhoto: products.filter(p => p.images.length > 0).length,
      bySeries: {
        '流構系列': products.filter(p => p.series === '流構系列').length,
        '標準系列': products.filter(p => p.series === '標準系列').length,
        '客製系列': products.filter(p => p.series === '客製系列').length,
        '畫作系列': products.filter(p => p.series === '畫作系列').length,
      },
    };
    console.log('  統計：', JSON.stringify(stats, null, 2).replace(/\n/g, '\n  '));

    // 3. 輸出 JSON
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

    const output = {
      generated: new Date().toISOString(),
      stats,
      products,
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n📄 已輸出：${OUT_FILE}`);
    console.log(`   檔案大小：${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB`);
    console.log('');

  } catch (err) {
    console.error('\n❌ 失敗：', err.message);
    console.error('');

    // 失敗時輸出空的 JSON，讓網站不會崩潰
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify({
      generated: new Date().toISOString(),
      error: err.message,
      stats: { total: 0 },
      products: [],
    }, null, 2));
    console.warn('⚠️  已輸出空資料檔，網站不會崩潰但不會顯示作品');

    process.exit(1); // 讓 Netlify 知道 build 失敗
  }
}

main();

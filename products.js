// netlify/functions/products.js
// 即時從 Airtable 抓作品資料，解決圖片 URL 過期問題

const https = require('https');

const TOKEN   = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'app7TEyzrUHAXOscY';
const TABLE   = process.env.AIRTABLE_TABLE   || 'tblxnasqPBb1Su6PA';

const FIELDS = {
  sku:      'SKU產品編號',
  name:     '作品名稱',
  nameEn:   '英文名稱',
  category: '類別',
  material: '材料',
  method:   '工法',
  func:     '功能',
  suitable: '適合',
  spec:     '規格公分（長Ｘ寬Ｘ高）',
  weightG:  '重量（克）',
  weightKg: '重量（公斤）',
  carbon:   '預估減碳量數據',
  special:  '特殊',
  stock:    '庫存',
  hidden:   '隱藏',
  images:   'AI圖',
  series:   '系列',
  story:    '作品故事（中英文）',
};

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

async function fetchAll() {
  let records = [], offset = null;

  do {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?pageSize=100${offset ? `&offset=${offset}` : ''}`;
    const { status, data } = await httpsGet(url, { Authorization: `Bearer ${TOKEN}` });
    if (status !== 200) throw new Error(`Airtable HTTP ${status}: ${JSON.stringify(data)}`);
    records = records.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);

  return records;
}

function airtableValue(value) {
  if (Array.isArray(value)) {
    return value
      .map(v => (v && typeof v === 'object') ? (v.name || v.url || v.text || '') : String(v))
      .filter(Boolean)
      .join('、');
  }
  if (value && typeof value === 'object') return value.name || value.text || value.url || '';
  return value ?? '';
}

function pickField(fields, names) {
  for (const name of names) {
    const value = fields[name];
    if (value !== undefined && value !== null && value !== '') return airtableValue(value);
  }
  return '';
}

function compareProducts(a, b) {
  const ax = String(a.sku || a.name || '');
  const bx = String(b.sku || b.name || '');
  return ax.localeCompare(bx, 'zh-Hant-u-kn-true', { numeric: true, sensitivity: 'base' });
}

function parseRecord(rec) {
  const f = rec.fields;

  // 隱藏勾選 → 不顯示
  if (f[FIELDS.hidden]) return null;

  // 特殊欄位（非賣品）
  const specialRaw = f[FIELDS.special] || [];
  const isNotForSale = Array.isArray(specialRaw) ? specialRaw.includes('非賣品') : specialRaw === '非賣品';

  const rawImages = f[FIELDS.images] || [];
  const images = rawImages.map(img => ({
    url:      img.url,
    thumb_sm: img.thumbnails?.small?.url  || img.url,
    thumb_lg: img.thumbnails?.large?.url  || img.url,
    thumb_xl: img.thumbnails?.full?.url   || img.url,
  }));

  const weightG  = f[FIELDS.weightG]  || 0;
  const weightKg = f[FIELDS.weightKg] || 0;
  const weight   = weightG || (weightKg ? weightKg * 1000 : null);
  // weightKg 欄位值本身含 'kg'（如 '3.2kg'），直接用；weightG 欄位是純數字需格式化
  const weightDisplay = weightKg
    ? String(weightKg).trim()
    : (weightG >= 1000 ? `${(weightG/1000).toFixed(1)} kg` : weightG ? `${weightG} g` : null);
  // carbonDisplay：Airtable 值已含 'kg'，直接顯示
  const carbonRaw = f[FIELDS.carbon] || null;
  const carbonDisplay = carbonRaw ? String(carbonRaw).trim() : null;

  const storyCombined = pickField(f, [FIELDS.story, '作品故事', '故事', '作品介紹']);
  const storyZh = pickField(f, ['中文故事', '作品故事（中文）', '作品故事中文', '故事中文', '中文作品故事', '作品故事_中文']);
  const storyEn = pickField(f, ['英文故事', '作品故事（英文）', '作品故事英文', '故事英文', '英文作品故事', 'English Story', 'Story EN', '作品故事_英文']);
  const story = storyCombined || [storyZh, storyEn].filter(Boolean).join('\n\n');

  // 庫存（Airtable 單選欄位有時回傳 array，有時回傳 string）
  const stockRaw = Array.isArray(f[FIELDS.stock])
    ? f[FIELDS.stock][0]
    : (f[FIELDS.stock] || '');
  const stockMap = { '有現貨':'available', '可預訂':'order', '已售出':'sold', '獨一件':'unique' };
  const stockStatus = stockMap[stockRaw] || 'unknown';

  return {
    id:          rec.id,
    sku:         f[FIELDS.sku]      || '',
    name:        f[FIELDS.name]     || '未命名作品',
    nameEn:      f[FIELDS.nameEn]   || '',
    series:      f[FIELDS.series]   || '其他',
    category:    f[FIELDS.category] || '',
    material:    f[FIELDS.material] || '',
    method:      f[FIELDS.method]   || '',
    func:        f[FIELDS.func]     || '',
    suitable:    f[FIELDS.suitable] || '',
    spec:        f[FIELDS.spec]     || '',
    weight,
    weightDisplay,
    carbonDisplay,
    isNotForSale,
    stockStatus,
    isUnique:    stockStatus === 'unique',
    images,
    mainImg:     images[0]?.thumb_lg || '',
    mainImgFull: images[0]?.thumb_xl || images[0]?.url || '',
    story,
    storyZh,
    storyEn,
  };
}

exports.handler = async function(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    };
  }

  if (!TOKEN) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'AIRTABLE_TOKEN 未設定' })
    };
  }

  try {
    const records  = await fetchAll();
    const products = records.map(parseRecord).filter(Boolean).sort(compareProducts);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 快取 5 分鐘
      },
      body: JSON.stringify({
        generated: new Date().toISOString(),
        stats: { total: products.length },
        products
      })
    };

  } catch (err) {
    console.error('products function error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

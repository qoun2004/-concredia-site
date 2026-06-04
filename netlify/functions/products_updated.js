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
  status:   '狀態',   // ← 新增：上架中 / 非賣品 / 不公開 / 已停售
  stock:    '庫存',
  hidden:   '隱藏',
  images:   'AI圖',
  series:   '系列',
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
  const fieldValues = Object.values(FIELDS);
  const fieldsParam = fieldValues.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
  let records = [], offset = null;

  do {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?${fieldsParam}${offset ? `&offset=${offset}` : ''}`;
    const { status, data } = await httpsGet(url, { Authorization: `Bearer ${TOKEN}` });
    if (status !== 200) throw new Error(`Airtable HTTP ${status}: ${JSON.stringify(data)}`);
    records = records.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);

  return records;
}

function parseRecord(rec, index) {
  const f = rec.fields;
  if (f[FIELDS.hidden]) return null;
  
  // 狀態為不公開則不顯示
  const statusArr = f['狀態'] || [];
  const statusVal = Array.isArray(statusArr) ? statusArr[0] : statusArr;
  if (statusVal === '不公開') return null;
  const isNotForSale = statusVal === '非賣品';
  // 狀態欄位（Multiple select，取第一個值）
  const statusRaw = Array.isArray(f[FIELDS.status])
    ? f[FIELDS.status][0]
    : (f[FIELDS.status] || '上架中');

  // 不公開 → 不顯示
  if (statusRaw === '不公開') return null;

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
  const weightDisplay = weightKg
    ? String(weightKg).trim()
    : (weightG >= 1000 ? `${(weightG/1000).toFixed(1)} kg` : weightG ? `${weightG} g` : null);
  const carbonRaw = f[FIELDS.carbon] || null;
  const carbonDisplay = carbonRaw ? String(carbonRaw).trim() : null;

  // 庫存（獨一件等）
  const stockRaw = Array.isArray(f[FIELDS.stock])
    ? f[FIELDS.stock][0]
    : (f[FIELDS.stock] || '');
  // 狀態欄位（狀態=不公開 → 不顯示）
const statusRaw = Array.isArray(f['狀態']) ? f['狀態'][0] : (f['狀態'] || '');
if (statusRaw === '不公開') return null;
const isNotForSale = statusRaw === '非賣品';
  const stockMap = { '有現貨':'available', '可預訂':'order', '已售出':'sold', '獨一件':'unique' };
  const stockStatus = stockMap[stockRaw] || 'unknown';

  return {isNotForSale,
    id:           rec.id,
    sku:          f[FIELDS.sku]      || '',
    name:         f[FIELDS.name]     || '未命名作品',
    nameEn:       f[FIELDS.nameEn]   || '',
    series:       f[FIELDS.series]   || '其他',
    category:     f[FIELDS.category] || '',
    material:     f[FIELDS.material] || '',
    method:       f[FIELDS.method]   || '',
    func:         f[FIELDS.func]     || '',
    suitable:     f[FIELDS.suitable] || '',
    spec:         f[FIELDS.spec]     || '',
    weight,
    weightDisplay,
    carbonDisplay,
    productStatus: statusRaw,          // ← 上架中 / 非賣品 / 已停售
    isNotForSale:  statusRaw === '非賣品',
    stockStatus,
    isUnique:     stockStatus === 'unique',
    images,
    mainImg:      images[0]?.thumb_lg || '',
    mainImgFull:  images[0]?.thumb_xl || images[0]?.url || '',
  };
}

exports.handler = async function(event) {
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
    const products = records.map(parseRecord).filter(Boolean);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
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

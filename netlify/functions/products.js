function parseRecord(rec, index) {
  const f = rec.fields;
  if (f[FIELDS.hidden]) return null;

  // 狀態欄位處理
  const statusArr = f['狀態'] || [];
  const statusVal = Array.isArray(statusArr) ? statusArr[0] : statusArr;
  if (statusVal === '不公開') return null;
  const isNotForSale = statusVal === '非賣品';

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

  const stockRaw = f[FIELDS.stock] || '';
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
    stockStatus,
    isUnique:    stockStatus === 'unique',
    isNotForSale,
    images,
    mainImg:     images[0]?.thumb_lg || '',
    mainImgFull: images[0]?.thumb_xl || images[0]?.url || '',
  };
}

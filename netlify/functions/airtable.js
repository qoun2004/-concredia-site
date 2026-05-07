// Concredia.Lab · Airtable 代理 Function
// Token 存在 Netlify 環境變數，不暴露於前端
exports.handler = async (event) => {
  const token   = process.env.AIRTABLE_TOKEN;
  const baseId  = process.env.AIRTABLE_BASE_ID  || 'app7TEyzrUHAXOscY';
  const table   = process.env.AIRTABLE_TABLE     || 'Concredia.Lab';

  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AIRTABLE_TOKEN 環境變數未設定' })
    };
  }

  // 把前端傳來的 query params 轉給 Airtable
  const params = new URLSearchParams(event.queryStringParameters || {});
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params}`;

  try {
    const res  = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

// Concredia.Lab · AI 助理 + Airtable 代理 Function

exports.handler = async (event) => {
  const path = event.path || '';

  // ── 路由：Airtable 代理 (/airtable)
  if (path.endsWith('/airtable') || event.queryStringParameters?.airtable) {
    return handleAirtable(event);
  }

  // ── 路由：AI 助理 (POST /chat)
  return handleChat(event);
};

// ── Airtable 代理
async function handleAirtable(event) {
  const token  = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || 'app7TEyzrUHAXOscY';
  const table  = process.env.AIRTABLE_TABLE   || 'Concredia.Lab';

  if (!token) {
    return { statusCode:500, body: JSON.stringify({ error:'AIRTABLE_TOKEN 未設定' }) };
  }

  const params = new URLSearchParams(event.queryStringParameters || {});
  params.delete('airtable');
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params}`;

  try {
    const res  = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    return {
      statusCode: res.status,
      headers:{ 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' },
      body: JSON.stringify(data),
    };
  } catch(err) {
    return { statusCode:500, body:JSON.stringify({ error:err.message }) };
  }
}

// ── AI 助理
async function handleChat(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' },
      body: JSON.stringify({ reply:'AI 助理目前維護中，請直接 Email 聯繫 concredialab@gmail.com' })
    };
  }

  let userMessage = '你好';
  try {
    const body = JSON.parse(event.body || '{}');
    userMessage = body.message || '你好';
  } catch(e) {}

  const systemPrompt = `你是 Concredia.Lab 士敏文品工作室的 AI 助理，代表品牌創辦人 Rovi Lee（李俊憲）博士回答問題。

品牌核心：
- 用台灣的營建廢棄物（再生磚、廢玻璃、爐石粉、蚵殼）製作水泥家具、音響、藝術作品
- EAC 骨料裸露工法，台灣自主研發，9年研發
- 再生廢料佔比 60-70%，每件附材料溯源文件
- 副品牌：Conga Taiwan 康加台灣，士敏小礦獸遊戲
- 核心理念：「廢棄物是被錯置的資源」「為台灣的營建廢棄物找一個出路」

回答風格：
- 親切、有溫度，帶有台灣職人精神
- 重點簡潔，不超過 150 字
- 如需要對接洽詢，引導到 concredialab@gmail.com
- 繁體中文回答`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role:'user', content: userMessage }]
      })
    });

    const data = await res.json();
    const reply = data.content?.[0]?.text || '抱歉，我現在無法回應，請直接 Email 聯繫。';

    return {
      statusCode: 200,
      headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' },
      body: JSON.stringify({ reply })
    };
  } catch(err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' },
      body: JSON.stringify({ reply:'目前服務暫時中斷，請直接 Email 聯繫 concredialab@gmail.com' })
    };
  }
}

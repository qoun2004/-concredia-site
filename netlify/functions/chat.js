// netlify/functions/chat.js
// Concredia.Lab AI 助理 — Groq 版本

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: '⚠️ API key 未設定，請聯絡管理員。' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: '無效的請求格式' }) };
  }

  const userMessage = body.message || '';
  const history    = body.history  || [];

  if (!userMessage.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: '請輸入訊息' }) };
  }

  // ── 系統提示詞 ──────────────────────────────────────────
  const SYSTEM_PROMPT = `你是 Concredia.Lab 士敏文品的 AI 助理，名字叫「寶妹助理」，個性親切、專業但帶點溫度，偶爾會提到工作室裡的法鬥犬寶妹。

【品牌基本資訊】
- 品牌名稱：Concredia.Lab 士敏文品
- 創辦人：李俊憲（Rovi Lee），土木工程博士
- 核心技術：EAC（Exposed Aggregate Concrete）骨料裸露工法，9年研發
- 官網：concredia.tw
- Email：concredia.lab@gmail.com
- 地點：彰化縣和美鎮北溪路119號（工作室預約制參觀）

【產品資訊】
- 流構系列：漂流木 × 再生混凝土，模組化可調高度，企業裝置首選
- 標準系列：定錨桌几、茶几、Conbox 水泥盆器、水泥音響，現貨供應
- 客製系列：燈具、裝置、建案落成禮，可用客戶自己的廢料製作
- 畫作系列：PS板手工割製浮雕畫作，Rovi親簽限量，PAM(64×32cm)、PAL(100×56cm)
- 桌腳系列：TSH(110cm吧台高)、TSM(75cm標準桌高)、TSL(45cm茶几高)
- 盆器系列：CTS(方型)、CTT(三角型)、CTI(其他)

【材料與工法】
- 再生廢料佔比：60–70%（廢磚骨料、廢玻璃、爐石粉、蚵殼）
- 每件作品都有鋼筋，養護28天達建築設計強度
- 純無機材質，不添加塑膠，回收容易
- PS板模板系統（獨創工法，申請中）
- 配方比例保密，不申請專利（如可口可樂）

【ESG 資訊】
- 每件附材料溯源文件，符合 GRI 標準
- 對應 SDG 11.6（城市廢棄物減量）、SDG 12.5（廢棄物減量）
- 企業採購20件以上提供客製ESG文件套件
- 符合台灣政府綠色採購規範
- 每件作品提供減碳數據（CO₂e）

【客製刻字】
- 支援中文、英文、日文及任意語言
- 可刻LOGO、廟宇圖騰、家族符號、婚禮誓詞、手繪圖稿
- 刻字永久嵌入，不褪色

【NFC 晶片】
- 部分作品嵌入NFC晶片，掃描可查詢材料溯源、減碳數據、ESG文件

【交期與購買】
- 標準系列現貨：7–14個工作天
- 客製設計：+2–4週（含28天養護期）
- 企業大量採購（20件以上）：請提前6–8週詢問
- 付款方式：LINE Pay、銀行轉帳，企業可開發票

【竹塘社區計畫】
- 「掃一張桌子」計畫，Hub & Satellite衛星工廠模式
- 水磨外包費約NT$1,500/件，在地就業模型

【寂寞公路計劃】
- 台26線末端旭海，帶著水泥作品旅行
- 在路邊佈置桌椅，邀請環島旅人共享時光

【回答原則】
1. 繁體中文回答（除非用戶用英文問）
2. 簡潔親切，不要太長，重點突出
3. 不確定的事情說「請直接聯絡我們確認」
4. 價格問題說「請透過聯絡表單詢問報價」（價格因客製程度而異）
5. 如果問到購買，引導到 concredia.tw/contact.html
6. 偶爾可以提到寶妹（工作室的法鬥犬）增加溫度
7. 不要捏造不確定的資訊`;

  // ── 組建對話歷史 ──────────────────────────────────────
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const msg of history) {
    if (msg.role && msg.content) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  // ── 呼叫 Groq API ──────────────────────────────────────
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 600,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', response.status, errText);
      let errJson = {};
      try { errJson = JSON.parse(errText); } catch {}
      const reason = errJson?.error?.message || `HTTP ${response.status}`;
      return {
        statusCode: 500,
        body: JSON.stringify({ reply: `⚠️ API 錯誤：${reason}` })
      };
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content
      || '抱歉，我沒有理解您的問題，請換個方式再問一次，或直接聯繫我們 concredia.lab@gmail.com 🐾';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error('Fetch error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: '網路異常，請稍後再試，或直接 Email：concredia.lab@gmail.com' })
    };
  }
};

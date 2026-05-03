exports.handler = async function(event, context) {
  // 只允許 POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { messages } = JSON.parse(event.body);

    const SYSTEM_PROMPT = `你是 Concredia.Lab 的 AI 助理，代表這個品牌回答問題。請用繁體中文回答，語氣親切專業，回答簡潔（3-5句為佳）。

關於 Concredia.Lab 的核心資訊：
- 品牌：Concredia.Lab，士敏文品工作室，創辦人 Dr. Rovi Lee（李俊憲），國立中央大學營建管理博士，來自「孔固力庄」
- 核心技術：EAC（Exposed Aggregate Concrete）骨料裸露工法，水磨 #50 到 #5000，讓廢料的地質記憶重現
- 材料：70%+ 再生廢料（碎磚、廢玻璃、爐石粉、再生骨料等）+ 30% 水泥，碳排削減 -62%，每件附材料溯源文件
- 產品系列：① 流構系列 Flow Structure（模組化家具，可調高度，漂流木桌板）② Ready-made 標準量產（定錨桌几、水泥音響、燈具、Conbox 等）③ Custom-made 客製故事系列（企業 ESG 禮品、紀念磚等）
- ESG 文件套件：材料溯源報告、碳足跡計算書（GRI 格式）、綠色採購符合聲明、品牌故事授權、2026 碳費預備文件，5個工作天提供
- 企業合作：ESG 禮品採購 / 辦公商業空間採購 / 長期永續夥伴（企業提供廢料→轉化作品→回饋 ESG 文件）
- 掃一張桌子：彰化竹塘鄉農會社區計畫，70% 在地廢料製成公共桌椅，Hub & Satellite 技術授權模式
- 聯絡：concredialab@gmail.com
- 網站：concredialab.netlify.app
- 團隊：Rovi 老師（研發）、建凱 Kasper（品牌）、葳葳 Vivian（企業發展）、寶妹（首席士氣官）

如果問到價格，請說「價格依規格而定，歡迎來信 concredialab@gmail.com 或填寫聯絡表單，我們會在2個工作天內回覆報價」。
如果問到不確定的細節，請誠實說「這個問題建議直接聯絡我們確認，Email: concredialab@gmail.com」。
不要編造產品規格或價格數字。`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API 錯誤');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: data.content[0].text,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        reply: '抱歉，暫時無法回應。請直接聯絡 concredialab@gmail.com',
      }),
    };
  }
};

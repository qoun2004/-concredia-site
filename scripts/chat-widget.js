/* ============================================================
   Concredia.Lab 寶妹助理 — 浮動 AI 客服對話框
   引入方式：<script src="scripts/chat-widget.js" defer></script>
   ============================================================ */

(function () {
  // ── 樣式 ────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #clab-chat-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9999;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9b5b3a 0%, #c8793a 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(155,91,58,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #clab-chat-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(155,91,58,0.6);
    }
    #clab-chat-btn svg { width: 26px; height: 26px; }

    #clab-chat-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      background: #e05252;
      border-radius: 50%;
      font-size: 10px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      font-weight: 700;
      display: none;
    }

    #clab-chat-panel {
      position: fixed;
      bottom: 5.5rem;
      right: 2rem;
      z-index: 9998;
      width: 340px;
      max-width: calc(100vw - 2rem);
      background: #1c1a17;
      border: 1px solid rgba(155,91,58,0.25);
      border-radius: 16px;
      overflow: hidden;
      display: none;
      flex-direction: column;
      box-shadow: 0 12px 48px rgba(0,0,0,0.55);
      font-family: 'Noto Sans TC', sans-serif;
    }
    #clab-chat-panel.open { display: flex; }

    #clab-chat-header {
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, rgba(155,91,58,0.18) 0%, rgba(30,27,23,0) 100%);
      border-bottom: 1px solid rgba(155,91,58,0.15);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    #clab-chat-header .avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9b5b3a, #c8793a);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    #clab-chat-header .info { flex: 1; }
    #clab-chat-header .name {
      font-size: 0.88rem; font-weight: 600;
      color: rgba(212,207,200,0.9);
      letter-spacing: 0.05em;
    }
    #clab-chat-header .status {
      font-size: 0.68rem;
      color: rgba(212,207,200,0.45);
      letter-spacing: 0.08em;
    }
    #clab-chat-close {
      background: none; border: none; cursor: pointer;
      color: rgba(212,207,200,0.45); font-size: 1.3rem; line-height: 1;
      padding: 0.25rem; transition: color 0.15s;
    }
    #clab-chat-close:hover { color: rgba(212,207,200,0.85); }

    #clab-chat-messages {
      flex: 1;
      height: 300px;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      scrollbar-width: thin;
      scrollbar-color: rgba(155,91,58,0.3) transparent;
    }

    .clab-msg {
      max-width: 88%;
      font-size: 0.82rem;
      line-height: 1.65;
      border-radius: 12px;
      padding: 0.6rem 0.9rem;
      animation: clab-fadein 0.2s ease;
    }
    @keyframes clab-fadein { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: none; } }

    .clab-msg.bot {
      background: rgba(155,91,58,0.12);
      border: 1px solid rgba(155,91,58,0.18);
      color: rgba(212,207,200,0.85);
      align-self: flex-start;
    }
    .clab-msg.user {
      background: rgba(155,91,58,0.22);
      border: 1px solid rgba(155,91,58,0.32);
      color: rgba(212,207,200,0.95);
      align-self: flex-end;
    }
    .clab-msg.typing {
      background: rgba(155,91,58,0.08);
      border: 1px solid rgba(155,91,58,0.12);
      color: rgba(212,207,200,0.45);
    }

    #clab-chat-input-area {
      display: flex;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      border-top: 1px solid rgba(155,91,58,0.12);
      background: rgba(15,13,11,0.4);
    }
    #clab-chat-input {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(155,91,58,0.2);
      border-radius: 8px;
      padding: 0.55rem 0.85rem;
      font-size: 0.82rem;
      color: rgba(212,207,200,0.9);
      font-family: inherit;
      resize: none;
      outline: none;
      transition: border-color 0.15s;
    }
    #clab-chat-input:focus { border-color: rgba(155,91,58,0.5); }
    #clab-chat-input::placeholder { color: rgba(212,207,200,0.3); }
    #clab-chat-send {
      background: linear-gradient(135deg, #9b5b3a, #c8793a);
      border: none; border-radius: 8px;
      width: 38px; height: 38px;
      cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.15s;
    }
    #clab-chat-send:hover { opacity: 0.85; }
    #clab-chat-send svg { width: 16px; height: 16px; }

    #clab-chat-hint {
      font-size: 0.65rem;
      color: rgba(212,207,200,0.28);
      text-align: center;
      padding: 0 1rem 0.65rem;
      letter-spacing: 0.05em;
    }

    @media (max-width: 480px) {
      #clab-chat-panel { right: 1rem; width: calc(100vw - 2rem); bottom: 5rem; }
      #clab-chat-btn { bottom: 1.25rem; right: 1.25rem; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML 結構 ────────────────────────────────────────────────
  const btn = document.createElement('button');
  btn.id = 'clab-chat-btn';
  btn.setAttribute('aria-label', '開啟 AI 客服');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span id="clab-chat-badge"></span>
  `;

  const panel = document.createElement('div');
  panel.id = 'clab-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '寶妹助理對話框');
  panel.innerHTML = `
    <div id="clab-chat-header">
      <div class="avatar">🐾</div>
      <div class="info">
        <div class="name">寶妹助理</div>
        <div class="status">Concredia.Lab · AI 客服</div>
      </div>
      <button id="clab-chat-close" aria-label="關閉">✕</button>
    </div>
    <div id="clab-chat-messages">
      <div class="clab-msg bot">哈囉！我是寶妹助理 🐾<br>有關於士敏文品的問題都可以問我——材料、工法、ESG、訂購都行！</div>
    </div>
    <div id="clab-chat-input-area">
      <textarea id="clab-chat-input" rows="1" placeholder="輸入問題…" maxlength="500"></textarea>
      <button id="clab-chat-send" aria-label="送出">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <div id="clab-chat-hint">由 Gemini AI 提供支援 · 問題複雜可 <a href="contact.html" style="color:rgba(155,91,58,0.8)">聯絡我們</a></div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  // ── 邏輯 ────────────────────────────────────────────────────
  const messagesEl = document.getElementById('clab-chat-messages');
  const inputEl    = document.getElementById('clab-chat-input');
  const sendBtn    = document.getElementById('clab-chat-send');
  const closeBtn   = document.getElementById('clab-chat-close');
  const badge      = document.getElementById('clab-chat-badge');

  let history = [];
  let isOpen  = false;
  let hasShownBadge = false;

  // 開關面板
  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (isOpen) {
      badge.style.display = 'none';
      hasShownBadge = true;
      setTimeout(() => inputEl.focus(), 100);
    }
  }

  // 提示 badge（5 秒後出現一次）
  setTimeout(function () {
    if (!isOpen && !hasShownBadge) {
      badge.style.display = 'flex';
      badge.textContent = '1';
    }
  }, 5000);

  btn.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', togglePanel);

  // Enter 送出（Shift+Enter 換行）
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);

  function addMsg(text, role) {
    const div = document.createElement('div');
    div.className = 'clab-msg ' + role;
    div.innerHTML = text.replace(/\n/g, '<br>');
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = '';
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });

    const typing = addMsg('寶妹正在思考中…', 'bot typing');

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-10) })
      });
      const data = await res.json();
      const reply = data.reply || '抱歉，我沒有接收到回覆，請稍後再試。';

      typing.remove();
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply });

    } catch (err) {
      typing.remove();
      addMsg('網路異常，請稍後再試，或直接 <a href="contact.html" style="color:#c8793a">聯絡我們</a>。', 'bot');
    }
  }

  // 自動調整 textarea 高度
  inputEl.addEventListener('input', function () {
    this.style.height = '';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

})();

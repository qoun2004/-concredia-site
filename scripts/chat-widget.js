(function () {
  var existing = document.querySelector('[data-concredia-chat]');
  if (existing) return;

  var contactHref = 'contact.html';
  var btn = document.createElement('a');
  btn.href = contactHref;
  btn.setAttribute('data-concredia-chat', 'true');
  btn.setAttribute('aria-label', '聯絡 Concredia.Lab');
  btn.textContent = '聯絡';
  btn.style.cssText = [
    'position:fixed',
    'right:18px',
    'bottom:18px',
    'z-index:80',
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'min-width:52px',
    'height:44px',
    'padding:0 14px',
    'border-radius:999px',
    'background:#A9653D',
    'color:#fff',
    'font:700 13px/1 system-ui,-apple-system,BlinkMacSystemFont,"Noto Sans TC",sans-serif',
    'letter-spacing:.04em',
    'text-decoration:none',
    'box-shadow:0 8px 22px rgba(39,35,31,.18)'
  ].join(';');

  var media = window.matchMedia('(max-width: 768px)');
  function sync() {
    btn.style.right = media.matches ? '14px' : '18px';
    btn.style.bottom = media.matches ? '14px' : '18px';
    btn.style.height = media.matches ? '42px' : '44px';
  }
  sync();
  if (media.addEventListener) media.addEventListener('change', sync);

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(btn);
  });
})();

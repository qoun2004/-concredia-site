#!/usr/bin/env python3
"""
Concredia.Lab 文章自動轉換腳本
把 _posts/*.md 轉成 HTML 頁面，並更新 blog.html 列表和 index.html 最新動態
"""

import os, re, glob
from datetime import datetime
import frontmatter
import markdown

POSTS_DIR = '_posts'
posts = []

for md_file in sorted(glob.glob(f'{POSTS_DIR}/*.md'), reverse=True):
    filename = os.path.basename(md_file)
    if filename == 'example.md' or filename.startswith('_'):
        continue
    with open(md_file, 'r', encoding='utf-8') as f:
        post = frontmatter.load(f)
    m = re.match(r'(\d{4}-\d{2}-\d{2})-(.+)\.md', filename)
    if not m:
        continue
    date_str = m.group(1)
    slug = m.group(2)
    html_filename = f'blog-{slug}.html'
    body_html = markdown.markdown(post.content, extensions=['extra', 'nl2br'])

    youtube_url = post.metadata.get('youtube', '')
    youtube_embed = ''
    if youtube_url:
        yt_match = re.search(r'(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})', youtube_url)
        if yt_match:
            yt_id = yt_match.group(1)
            youtube_embed = f'''<div style="position:relative;width:100%;aspect-ratio:16/9;margin:2rem 0;">
  <iframe src="https://www.youtube.com/embed/{yt_id}"
    style="position:absolute;inset:0;width:100%;height:100%;border:none;"
    allowfullscreen></iframe>
</div>'''

    tags = post.metadata.get('tags', [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(',')]

    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        date_display = f'{dt.year} 年 {dt.month} 月'
    except:
        date_display = date_str

    thumbnail = post.metadata.get('thumbnail', 'images/story-night.jpg')
    if isinstance(thumbnail, str) and thumbnail.startswith('/'):
        thumbnail = thumbnail[1:]

    posts.append({
        'title':         post.metadata.get('title', '未命名文章'),
        'date':          date_str,
        'date_display':  date_display,
        'category':      post.metadata.get('category', '最新動態'),
        'thumbnail':     thumbnail,
        'excerpt':       post.metadata.get('excerpt', ''),
        'tags':          tags,
        'slug':          slug,
        'filename':      html_filename,
        'body_html':     body_html,
        'youtube_embed': youtube_embed,
    })

print(f"找到 {len(posts)} 篇文章")
# ============================================================
# 讀取共用 CSS（從 index.html 抽取）
# ============================================================
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

css_match = re.search(r'<style>(.*?)</style>', index_html, re.DOTALL)
shared_css = css_match.group(1) if css_match else ''

# ============================================================
# 產生每篇文章的 HTML 頁面
# ============================================================
ARTICLE_CSS = '''
.art-hero{position:relative;min-height:55vh;display:flex;align-items:flex-end;overflow:hidden;background:var(--concrete-dark);}
.art-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.5;}
.art-hero-scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,8,6,0.97) 0%,rgba(10,8,6,0.5) 50%,transparent 100%);}
.art-hero-content{position:relative;z-index:2;padding:0 4rem 4rem;max-width:820px;}
.art-category{font-size:0.62rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--rust-light);margin-bottom:1rem;display:flex;align-items:center;gap:0.6rem;}
.art-category::before{content:'';width:16px;height:1px;background:var(--rust-light);}
.art-title{font-family:var(--font-display);font-size:clamp(1.8rem,3.5vw,2.8rem);color:var(--warm-white);font-weight:700;line-height:1.15;margin-bottom:1rem;}
.art-meta{font-size:0.75rem;color:rgba(212,207,200,0.55);display:flex;gap:1.5rem;flex-wrap:wrap;}
.art-body{max-width:740px;margin:0 auto;padding:4rem 2rem;}
.art-body h2{font-family:var(--font-display);font-size:1.6rem;font-weight:700;color:var(--concrete-dark);margin:2.5rem 0 1rem;}
.art-body h3{font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:var(--concrete-dark);margin:2rem 0 0.75rem;}
.art-body p{font-size:0.97rem;color:#3A3632;line-height:1.92;font-weight:300;margin-bottom:1.25rem;}
.art-body strong{font-weight:600;color:var(--concrete-dark);}
.art-body em{font-style:italic;color:var(--rust);}
.art-body img{width:100%;margin:1.5rem 0;display:block;}
.art-body blockquote{margin:2rem 0;padding:1.5rem 2rem;background:var(--cream);border-left:4px solid var(--rust);font-family:var(--font-display);font-size:1.1rem;color:var(--concrete-dark);font-style:italic;line-height:1.65;}
.art-body blockquote p{margin:0;color:var(--concrete-dark);}
.art-body ul,.art-body ol{padding-left:1.5rem;margin-bottom:1.25rem;}
.art-body li{font-size:0.97rem;color:#3A3632;line-height:1.85;font-weight:300;margin-bottom:0.4rem;}
.art-tags{display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:2.5rem;padding-top:2rem;border-top:1px solid rgba(58,54,50,0.1);}
.art-tag{font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;border:1px solid rgba(58,54,50,0.2);color:var(--concrete);padding:0.28rem 0.7rem;}
.art-back-bar{padding:1.5rem 4rem;border-bottom:1px solid rgba(58,54,50,0.08);}
.art-back-bar a{display:inline-flex;align-items:center;gap:0.5rem;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--concrete);text-decoration:none;transition:color 0.2s;}
.art-back-bar a:hover{color:var(--rust);}
'''

for post in posts:
    tags_html = ''.join(f'<span class="art-tag">{t}</span>' for t in post['tags'])
    thumbnail = post['thumbnail']

    html = f'''<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{post['title']} — Concredia.Lab</title>
<meta name="description" content="{post['excerpt'][:120]}">
<link href="https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
{shared_css}
{ARTICLE_CSS}
</style>
</head>
<body>
<nav id="mainNav">
  <a href="index.html" class="nav-logo">Concredia<span class="dot">.</span><span class="lab">Lab</span></a>
  <ul class="nav-links">
    <li><a href="products.html">產品系列</a></li>
    <li><a href="gallery.html">作品影像集</a></li>
    <li><a href="blog.html" style="color:var(--rust);">最新動態</a></li>
    <li><a href="esg-dashboard.html">ESG 數據</a></li>
  </ul>
  <a href="contact.html" class="nav-cta">合作洽詢</a>
</nav>

<div style="padding-top:80px;">
  <div class="art-back-bar">
    <a href="blog.html">← 返回最新動態</a>
  </div>

  <div class="art-hero">
    <img class="art-hero-img" src="{thumbnail}" alt="{post['title']}">
    <div class="art-hero-scrim"></div>
    <div class="art-hero-content">
      <div class="art-category">{post['category']}</div>
      <h1 class="art-title">{post['title']}</h1>
      <div class="art-meta">
        <span>{post['date_display']}</span>
        <span>Concredia.Lab</span>
      </div>
    </div>
  </div>

  <div class="art-body">
    <p style="font-size:1.05rem;color:var(--concrete-dark);line-height:1.85;font-weight:300;margin-bottom:2rem;border-left:3px solid var(--rust);padding-left:1.5rem;font-style:italic;">{post['excerpt']}</p>
    {post['body_html']}
    {post['youtube_embed']}
    <div class="art-tags">{tags_html}</div>
  </div>
</div>

<footer style="padding:2rem 4rem;border-top:1px solid rgba(58,54,50,0.08);display:flex;align-items:center;justify-content:space-between;">
  <div style="font-family:var(--font-display);font-size:1rem;color:var(--charcoal);">Concredia<span style="color:var(--rust);">.</span>Lab</div>
  <div style="font-size:0.72rem;color:var(--concrete);opacity:0.45;">© 2025 Concredia.Lab</div>
</footer>

<script>
window.addEventListener('scroll', function(){{
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 60);
}});
</script>
</body>
</html>'''

    with open(post['filename'], 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"  ✓ {post['filename']}")

# ============================================================
# 更新 blog.html 文章列表
# ============================================================
with open('blog.html', 'r', encoding='utf-8') as f:
    blog_html = f.read()

# 建立文章卡片 HTML（C 風格）
cards_html = ''
for post in posts:
    if post.get('thumbnail'):
        thumb_inner = f'<img src="{post["thumbnail"]}" alt="{post["title"]}" loading="lazy"><div class="card-thumb-overlay"></div>'
    else:
        thumb_inner = '<span style="font-size:2rem">🧱</span>'
    cards_html += f"""
    <a href="{post['filename']}" class="blog-card-new" data-cat="{post['category']}">
      <div class="card-thumb">{thumb_inner}</div>
      <div class="card-body-new">
        <div class="card-cat-new">{post['category']}</div>
        <div class="card-title">{post['title']}</div>
        <div class="card-excerpt">{post['excerpt']}</div>
        <div class="card-foot-new">
          <span class="card-date-new">{post['date_display']}</span>
          <span class="card-read-new">閱讀全文 →</span>
        </div>
      </div>
    </a>"""


# 找到文章 grid 並替換內容（支援 blog-grid 和 blog-grid-all）
new_blog_html = re.sub(
    r'(<div[^>]+id="articleGrid"[^>]*>).*?(<!-- 新文章會由 CMS 發布後.*?-->)',
    r'\1\n' + cards_html + r'\n  \2',
    blog_html,
    flags=re.DOTALL
)

if new_blog_html == blog_html:
    new_blog_html = re.sub(
        r'(<div[^>]+id="articleGrid"[^>]*>).*?(</div>\s*<footer)',
        r'\1\n' + cards_html + r'\n</div>\n\n\2',
        blog_html,
        flags=re.DOTALL
    )

# 同步更新篩選列（從文章分類自動產生）
cat_emoji = {
    '倉庫日常': '🐾',
    'Maker 實錄': '⚙️',
    '寂寞公路計劃': '🛣️',
    '社區行動': '🌱',
    '媒體 & 活動': '📣',
}
seen_cats = []
for post in posts:
    cat = post['category']
    if cat and cat not in seen_cats:
        seen_cats.append(cat)

filter_btns = '\n  <button class="filter-btn active" onclick="filterCat(\'all\', this)">全部</button>\n'
for cat in seen_cats:
    emoji = cat_emoji.get(cat, '📌')
    filter_btns += f'  <button class="filter-btn" onclick="filterCat(\'{cat}\', this)">{emoji} {cat}</button>\n'

new_blog_html = re.sub(
    r'<div class="filter-bar" id="filterBar">.*?</div>',
    '<div class="filter-bar" id="filterBar">' + filter_btns + '</div>',
    new_blog_html,
    flags=re.DOTALL
)

with open('blog.html', 'w', encoding='utf-8') as f:
    f.write(new_blog_html)
print(f"\nblog.html 更新完成（{len(posts)} 篇文章，{len(seen_cats)} 個分類）")

# ============================================================
# 更新 index.html 最新動態（顯示最新三篇）
# ============================================================
with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

# 取最新三篇
latest = posts[:3]

if latest:
    cards = ''
    for post in latest:
        cards += f'''
    <div class="blog-card">
      <div class="blog-thumb" style="aspect-ratio:16/9;overflow:hidden;">
        <img src="{post['thumbnail']}" alt="{post['title']}"
          style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s;"
          onmouseover="this.style.transform='scale(1.04)'"
          onmouseout="this.style.transform='scale(1)'">
      </div>
      <div class="blog-info">
        <div class="blog-cat">{post['category']}</div>
        <h3 class="blog-title">{post['title']}</h3>
        <p class="blog-excerpt">{post['excerpt']}</p>
        <div class="blog-foot">
          <span class="blog-date">{post['date_display']}</span>
          <a class="blog-read" style="color:var(--rust);text-decoration:none;" href="{post['filename']}">閱讀全文 →</a>
        </div>
      </div>
    </div>'''

    # 替換 blog-grid 內容
    new_idx = re.sub(
        r'(<div class="blog-grid">).*?(</div>\s*</section>\s*<!-- GALLERY)',
        r'\1\n' + cards + r'\n  </div>\n\n</section>\n\n<!-- GALLERY',
        idx_html,
        flags=re.DOTALL
    )

    if new_idx != idx_html:
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_idx)
        print(f"index.html 最新動態更新完成（顯示 {len(latest)} 篇）")
    else:
        print("index.html blog-grid 標記找不到，跳過更新")

# ============================================================
# 產生 _data/posts.json 供管理頁使用
# ============================================================
import json, os
os.makedirs('_data', exist_ok=True)
posts_index = []
for post in posts:
    posts_index.append({
        'title':       post['title'],
        'date':        post['date'],
        'date_display': post['date_display'],
        'category':    post['category'],
        'excerpt':     post['excerpt'],
        'filename':    post['filename'],
        'md_filename': f"{post['date']}-{post['slug']}.md",
        'slug':        post['slug'],
        'tags':        post['tags'],
        'thumbnail':   post['thumbnail'],
    })

with open('_data/posts.json', 'w', encoding='utf-8') as f:
    json.dump({'posts': posts_index, 'total': len(posts_index)}, f, ensure_ascii=False, indent=2)
print(f"_data/posts.json 更新完成（{len(posts_index)} 篇）")

print("\n✅ 全部完成！")

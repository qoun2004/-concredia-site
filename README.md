# Concredia.Lab 網站檔案說明

## 📁 資料夾結構

```
concredia-site/
├── index.html          ← 主網站頁面（最新完整版）
├── netlify.toml        ← Netlify 部署設定（不要動）
├── README.md           ← 這份說明文件
├── admin/
│   ├── index.html      ← CMS 後台入口（不要動）
│   └── config.yml      ← CMS 欄位設定
└── images/             ← 上傳的圖片放這裡
```

---

## 🚀 最快部署方式（Netlify Drop，不需要 GitHub）

1. 前往 https://app.netlify.com/drop
2. 把整個 `concredia-site` 資料夾拖拉進去
3. 幾秒後得到網址：https://concredialab.netlify.app

---

## 🔧 從 GitHub 部署（進階）

1. 上傳所有檔案到 GitHub repository
2. 在 Netlify 連接 GitHub repo
3. Build settings：
   - Branch: main
   - Base directory: 留空
   - Build command: 留空
   - Publish directory: .（一個句點）
4. 點 Deploy

---

## 🔑 開啟後台管理（CMS）

部署完成後：
1. Netlify 後台 → Integrations → Identity → Enable
2. 再找 Git Gateway → Enable
3. 前往 你的網址/admin/
4. 點 Sign up 建立管理員帳號

---

## 📸 更換照片方式

在 index.html 搜尋以下關鍵字，找到對應位置：

- `hero-bg.jpg` → Hero 全幅背景圖（建議尺寸：1920×1080 以上）
- `ivor-lee.jpg` → Ivor 老師照片
- `kasper.jpg` → 建凱照片
- `baomei.jpg` → 寶妹照片
- `speaker.jpg` / `table.jpg` / `conbox.jpg` → 產品照片

把照片放進 images/ 資料夾，把 src 路徑改為 images/檔名.jpg

---

## ✏️ 日常更新（後台登入後）

| 選單 | 用途 |
|------|------|
| 最新動態 / 文章 | 新增、編輯部落格文章 |
| 產品系列 | 新增、編輯產品資訊 |
| 網站基本設定 | 修改聯絡資訊 |

---

© 2025 Concredia.Lab · Dr. Ivor Lee

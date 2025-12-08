# FFXIV Colorant Picker OGP Proxy

FF14カララントピッカーのOGP画像生成ファサード

## 概要

既存のFF14カララントピッカーの共有URLからOGP画像を動的生成し、SNSでの共有時に美しい色見本画像を表示します。

## 機能

- **OGP画像生成** (`/og`) - 3色のカラーパレット画像 (1200x630)
- **共有ページ** (`/share`) - OGPメタ付きHTMLで本体へリダイレクト

## URL形式

### 通常パレット
```
/share?palette=<LZString圧縮されたJSON>
/og?palette=<LZString圧縮されたJSON>
```

### カスタムパレット
```
/share?custom-palette=<LZString圧縮されたJSON>
/og?custom-palette=<LZString圧縮されたJSON>
```

## データ形式

### 通常パレット
```json
{
  "p": "dye_009",
  "s": ["dye_059", "dye_113"],
  "pt": "triadic"
}
```

### カスタムパレット
```json
{
  "p": {
    "type": "custom",
    "name": "カスタム色",
    "rgb": {"r": 100, "g": 150, "b": 200}
  },
  "s": ["dye_059", "dye_113"],
  "pt": "triadic"
}
```

## 開発

### 起動
```bash
# 依存関係をインストール
npm install

# 開発サーバー起動
npm run dev
```

### デプロイ
```bash
# Cloudflare Workersにデプロイ
npm run deploy
```

## 技術構成

- **Hono** - Web フレームワーク
- **@cloudflare/pages-plugin-vercel-og** - OGP画像生成
- **LZString** - URLパラメータ圧縮
- **Cloudflare Workers** - サーバーレス実行環境

## 外部依存

- `https://phantoml4rd.github.io/ffxiv-colorant-picker/data/dyes.json` - 色データカタログ

## ファイル構成

```
├── src/
│   └── index.tsx          # Honoアプリ本体
├── package.json
├── wrangler.toml          # Cloudflare Workers設定
└── tsconfig.json          # TypeScript設定
```

## OGP画像仕様

- **サイズ**: 1200x630
- **形式**: PNG
- **デザイン**: 黄金比に基づく3色カラーパレット
- **比率**: メイン色 (61.8%) : セカンダリ1 (23.6%) : セカンダリ2 (14.6%)
- **キャッシュ**: 開発時は無効、本番では1週間キャッシュ

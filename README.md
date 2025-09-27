# FFXIV Colorant Picker OGP Proxy

FF14カララントピッカーのOGP画像生成ファサード

## 概要

既存のFF14カララントピッカーの共有URLからOGP画像を動的生成し、SNSでの共有時に美しい色見本画像を表示します。

## 機能

- **OGP画像生成** (`/api/og`) - 3色の縦グラデーション画像 (800x800)
- **共有ページ** (`/share`) - OGPメタ付きHTMLで本体へリダイレクト

## URL形式

### 通常パレット
```
/share?palette=<LZString圧縮されたJSON>
/api/og?palette=<LZString圧縮されたJSON>
```

### カスタムパレット  
```
/share?custom-palette=<LZString圧縮されたJSON>
/api/og?custom-palette=<LZString圧縮されたJSON>
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

# 開発サーバー起動 (ローカル)
npm run dev-local

# Vercel開発サーバー起動
npm run dev
```

### デプロイ
```bash
# Vercelにデプロイ
vercel --prod
```

## 技術構成

- **Hono** - Web フレームワーク
- **Next.js ImageResponse** - OGP画像生成
- **LZString** - URLパラメータ圧縮
- **Vercel Edge Runtime** - サーバーレス実行環境

## 外部依存

- `https://phantoml4rd.github.io/ffxiv-colorant-picker/data/dyes.json` - 色データカタログ

## ファイル構成

```
├── api/
│   └── [[...route]].ts    # Vercel Edge adapter
├── src/
│   └── app.tsx            # Honoアプリ本体
├── package.json
├── vercel.json            # Vercel設定
├── tsconfig.json          # TypeScript設定
├── dev-server.js          # ローカル開発サーバー
└── test.sh                # テストURL生成スクリプト
```

## OGP画像仕様

- **サイズ**: 800x800 (正方形)
- **形式**: PNG
- **デザイン**: 3色縦グラデーション
- **比率**: メイン色 (5) : セカンダリ1 (2.5) : セカンダリ2 (1)
- **キャッシュ**: 開発時は無効、本番では長期キャッシュ推奨
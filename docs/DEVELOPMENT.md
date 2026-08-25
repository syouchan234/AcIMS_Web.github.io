# 開発・デプロイ手順

## 必要環境

- Node.js 22 以降
- npm

## セットアップ

```bash
npm ci
```

## ローカル起動

```bash
npm run dev
```

表示された URL をブラウザで開きます。スマホ実機で確認する場合は、HTTPS で配信された環境を利用してください。WebAuthn は安全なコンテキストでのみ利用できます。

## 確認

```bash
npm run lint
npm run test.unit
npm run test.e2e
npm run build
```

## デプロイ

GitHub Pages 用の静的ファイルを作成して公開するには、次を実行します。

```bash
npm run deploy
```

公開前に `homepage` の URL と `public/manifest.json` の内容を確認してください。


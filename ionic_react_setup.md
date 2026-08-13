# Ionic + React プロジェクト立ち上げ手順ガイド

Ionic Framework と React を組み合わせたモバイル・Webアプリケーション開発環境の構築から、ローカルサーバーでの起動手順をまとめたガイドです。

---

## 1. 事前準備（Node.js の確認）

Ionic React の開発には **Node.js**（推奨: 16.x 以上）および **npm** が必要です。

ターミナル（またはコマンドプロンプト / PowerShell）を開き、バージョンを確認します。

```bash
node -v
npm -v
```

※未インストールの場合は、[Node.js 公式サイト](https://nodejs.org/) から LTS 版をダウンロードしてインストールしてください。

---

## 2. Ionic CLI のインストール

プロジェクト作成や開発サーバーの起動に必要な **Ionic CLI** をグローバルにインストールします。

```bash
npm install -g @ionic/cli
```

---

## 3. Ionic React プロジェクトの新規作成

`ionic start` コマンドで React テンプレートのプロジェクトを作成します。

```bash
ionic start my-app tabs --type=react
```

### パラメータ解説
- **`my-app`**: 作成するプロジェクト名（任意の名前で可）
- **`tabs`**: スターターテンプレートの種類
  - `blank`: 空の最小限構成
  - `tabs`: タブナビゲーション構成
  - `sidemenu`: ドロワー（サイドメニュー）構成
- **`--type=react`**: UIライブラリに React を指定

> **Note**: コマンド実行中に「Create free Ionic account? (Y/n)」と尋ねられた場合は、`n` を入力してスキップしても問題ありません。

---

## 4. プロジェクトディレクトリへの移動

作成したプロジェクトのフォルダに移動します。

```bash
cd my-app
```

---

## 5. ローカル開発サーバーの起動

開発用ローカルサーバーを立ち上げます。自動的にブラウザが立ち上がり、アプリのプレビューが表示されます。

```bash
ionic serve
```

- デフォルトのアクセス URL: `http://localhost:8100`

---

## 6. 主なディレクトリエリア（プロジェクト構成）

立ち上げ完了後、主に編集するファイルは `src/` 配下に配置されています。

```text
my-app/
├── src/
│   ├── components/      # 再利用可能なUIコンポーネント
│   ├── pages/           # 各画面（ページ）のコンポーネント
│   ├── theme/           # カラーテーマ（variables.cssなど）
│   ├── App.tsx          # アプリ全体のルーティング・初期設定
│   └── main.tsx         # エントリーポイント
└── package.json
```

---

## 7. 便利なオプション＆コマンド

### iOS / Android 表示の同時プレビュー (`--lab`)
iOS・Androidそれぞれの表示イメージをブラウザ上で並べて確認できます。

```bash
ionic serve --lab
```
*(初回実行時に `@ionic/lab` のインストール確認が出たら `y` を押して進めてください)*

### ビルド（本番用ファイルの生成）
Webアプリケーションとして配信するための静的ファイルをビルドします。

```bash
npm run build
```

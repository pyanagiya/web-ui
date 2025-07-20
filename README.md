# TEIOS RAG WebUI

Azure Active Directoryを使用した企業向けRAG（Retrieval-Augmented Generation）チャットアプリケーション

## 🚀 特徴

- **Azure AD認証**: 企業のMicrosoftアカウントでのセキュアなログイン
- **RAG チャット**: 企業ドキュメントを基にした AI チャット
- **ドキュメント管理**: PDFやOfficeファイルのアップロードと管理
- **レスポンシブUI**: デスクトップ・モバイル対応

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14, React, TypeScript, Tailwind CSS
- **認証**: Azure AD (MSAL)
- **UIコンポーネント**: shadcn/ui
- **デプロイ**: Azure App Service
- **CI/CD**: GitHub Actions

## 📋 環境設定

### 1. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成し、適切な値を設定してください：

```bash
cp .env.example .env.local
```

必要な環境変数：

- `NEXT_PUBLIC_AZURE_AD_CLIENT_ID`: Azure ADアプリ登録のクライアントID
- `NEXT_PUBLIC_AZURE_AD_TENANT_ID`: Azure ADテナントID
- `NEXT_PUBLIC_API_URL`: バックエンドAPIのエンドポイント
- `NEXT_PUBLIC_AZURE_API_SCOPE`: APIアクセス用スコープ

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 🔧 Azure AD設定

Azure Active Directoryでのアプリ登録が必要です：

1. **Azure portal**でアプリを登録
2. **認証**設定でリダイレクトURIを追加: `http://localhost:3000` (開発用)
3. **APIアクセス許可**でMicrosoft Graph APIの権限を設定
4. **クライアントシークレット**は不要（SPAなので公開クライアント）

## 🚀 デプロイ

### Azure App Service

1. GitHub Actionsによる自動デプロイが設定済み
2. `main`ブランチへのプッシュで自動デプロイ実行
3. 本番環境: https://teios-ai-webui-iymm4la6qt4mo.azurewebsites.net

### 手動デプロイ

```bash
npm run build
npm start
```

## 📚 スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番ビルド
- `npm run start` - 本番サーバー起動
- `npm run lint` - ESLintチェック
- `npm run type-check` - TypeScript型チェック

## 🔒 セキュリティ

- Azure AD認証による企業レベルのセキュリティ
- 環境変数による機密情報の管理
- HTTPS対応（本番環境）
- CORS設定済み

## 📝 ライセンス

© 2024 TEIOS Corporation. All rights reserved.

## 🤝 貢献

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesまたは社内のIT部門にお問い合わせください。

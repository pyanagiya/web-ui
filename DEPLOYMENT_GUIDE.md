# Azure GitHub Actions CI/CD パイプライン設定ガイド

## CI/CD パイプライン概要

### 🔄 CI (Continuous Integration)
- **トリ## 6. トラブルシューティング

### CI/CDログの確認
GitHub Actions ページでワークフロー実行ログを確認

### App Serviceログの確認
```bash
# App Serviceのログを確認
az webapp log tail --name teios-ai-webui-iymm4la6qt4mo --resource-group teios-ai-rg
```

### 手動デプロイのテスト
GitHub ActionsのワークフローページからManual triggerで手動実行可能

### よくある問題
- **CI失敗**: ESLintエラー → `npm run lint:fix` で修正
- **型エラー**: TypeScriptエラー → `npm run type-check` で確認
- **デプロイ失敗**: Azure認証情報の確認、App Service設定の確認

## 7. セキュリティ考慮事項ンチへのプッシュ、PRイベント
- **実行内容**:
  - Node.js 18.x & 20.x でのマトリックステスト
  - ESLint による静的解析
  - TypeScript型チェック
  - Prettier によるコードフォーマットチェック
  - セキュリティ監査 (npm audit)
  - 依存関係の最新性チェック
  - テスト実行（将来実装）
  - ビルドテスト

### 🚀 CD (Continuous Deployment)
- **トリガー**: mainブランチへのプッシュのみ
- **実行内容**:
  - プロダクションビルド
  - Azure App Service へのデプロイ
  - デプロイ後のヘルスチェック

## 1. Azure Federated Identity (OIDC) の設定

### アプリ登録とFederated Identity Credential作成

以下のコマンドをAzure CLIで実行して、GitHub Actions用のOIDC設定を作成してください：

```bash
# Azure にログイン
az login

# アプリ登録を作成
az ad app create --display-name "teios-webui-github-oidc"

# サービスプリンシパルを作成（アプリIDを使用）
az ad sp create --id {app-id}

# Federated Identity Credentialを作成（メインブランチ用）
az ad app federated-credential create --id {app-id} --parameters '{
  "name": "teios-webui-github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:pyanagiya/web-ui:ref:refs/heads/main",
  "description": "GitHub Actions Main Branch",
  "audiences": ["api://AzureADTokenExchange"]
}'

# Federated Identity Credentialを作成（PR用）
az ad app federated-credential create --id {app-id} --parameters '{
  "name": "teios-webui-github-pr",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:pyanagiya/web-ui:pull_request",
  "description": "GitHub Actions Pull Request",
  "audiences": ["api://AzureADTokenExchange"]
}'

# リソースグループへのContributor権限を付与
az role assignment create --assignee {app-id} --role contributor --scope /subscriptions/{subscription-id}/resourceGroups/teios-ai-rg
```

### 作成済み設定情報
```
App ID (Client ID): 4a592fb1-77b4-4fb0-aa80-630c8ca9801b
Tenant ID: 75a0aac9-9542-45cd-8a40-b3a815e2e37a
Subscription ID: cfa5e3dc-3e95-4579-8538-301d0feadd21
```

## 2. GitHub Secrets の設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下のシークレットを追加：

- **AZURE_CLIENT_ID**: `4a592fb1-77b4-4fb0-aa80-630c8ca9801b`
- **AZURE_TENANT_ID**: `75a0aac9-9542-45cd-8a40-b3a815e2e37a`
- **AZURE_SUBSCRIPTION_ID**: `cfa5e3dc-3e95-4579-8538-301d0feadd21`

### OIDC（OpenID Connect）の利点
- **セキュリティ向上**: 長期間有効なシークレットが不要
- **自動ローテーション**: トークンは自動的に期限切れ
- **細かい制御**: 特定のブランチやPRのみアクセス可能

## 3. App Service の設定確認

App Service `teios-ai-webui-iymm4la6qt4mo` で以下を確認：

### 一般設定
- **ランタイムスタック**: Node.js 18 LTS
- **開始コマンド**: `node server.js`

### アプリケーション設定
必要に応じて以下の環境変数を設定：
- `WEBSITE_NODE_DEFAULT_VERSION`: `18.17.1`
- `SCM_DO_BUILD_DURING_DEPLOYMENT`: `true`
- `ENABLE_ORYX_BUILD`: `true`

### CORS設定
- フロントエンド用のCORS設定を適切に行う

## 4. ローカル開発とCI/CDの使い方

### 開発時のコマンド
```bash
# 開発サーバー起動
npm run dev

# コードフォーマット
npm run format

# リント実行
npm run lint

# 型チェック
npm run type-check

# すべてのCIチェックをローカルで実行
npm run ci
```

### ブランチ戦略
- **develop**: 開発用ブランチ（CIのみ実行）
- **main**: 本番用ブランチ（CI + 自動デプロイ実行）
- **feature/***: 機能開発ブランチ（PR時にCIチェック）

### プルリクエストフロー
1. feature ブランチで開発
2. PR作成時に自動でCI実行
3. コードレビュー + CI成功後にmainにマージ
4. mainマージ時に自動デプロイ実行

## 5. デプロイの実行

mainブランチにマージまたはプッシュすると自動的にデプロイが開始されます。

## 5. トラブルシューティング

### ログの確認
```bash
# App Serviceのログを確認
az webapp log tail --name teios-ai-webui-iymm4la6qt4mo --resource-group {your-resource-group}
```

### 手動デプロイのテスト
GitHub ActionsのワークフローページからManual triggerで手動実行可能。

## 6. セキュリティ考慮事項

- サービスプリンシパルの権限は最小限に制限
- 定期的なクレデンシャルのローテーション
- App Serviceの診断ログを有効化して監視

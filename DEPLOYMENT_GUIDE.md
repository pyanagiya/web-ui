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

## 1. Azure サービスプリンシパルの作成

以下のコマンドをAzure CLIで実行して、GitHub Actions用のサービスプリンシパルを作成してください：

```bash
# Azure にログイン
az login

# サブスクリプションを確認
az account show

# サービスプリンシパルを作成（App Serviceのリソースグループに対して）
az ad sp create-for-rbac \
  --name "teios-webui-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group-name} \
  --sdk-auth

# 出力されたJSONをコピーしてGitHubのSecretsに設定してください
```

## 2. GitHub Secrets の設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下のシークレットを追加：

- **AZURE_CREDENTIALS**: 上記コマンドで出力されたJSON全体

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

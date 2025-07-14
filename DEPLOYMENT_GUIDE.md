# Azure GitHub Actions デプロイ設定ガイド

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

## 4. デプロイの実行

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

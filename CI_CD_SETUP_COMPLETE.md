# 🚀 CI/CD パイプライン設定完了！

## ✅ 実装された機能

### 🔄 CI (Continuous Integration)
- **トリガー**: すべてのブランチ（push、PR）
- **マトリックステスト**: Node.js 18.x & 20.x
- **品質チェック**:
  - ESLint静的解析
  - TypeScript型チェック
  - Prettierフォーマットチェック
  - セキュリティ監査 (npm audit)
  - 依存関係更新チェック
  - プロダクションビルドテスト

### 🚀 CD (Continuous Deployment)  
- **トリガー**: mainブランチプッシュのみ
- **デプロイフロー**:
  - プロダクションビルド
  - Azure App Service自動デプロイ
  - デプロイ後ヘルスチェック
  - デプロイ成功通知

## 📋 次に必要なステップ

### 1. GitHub Secretsの設定
```bash
# GitHubリポジトリの Settings > Secrets and variables > Actions で設定:
AZURE_CLIENT_ID = 4a592fb1-77b4-4fb0-aa80-630c8ca9801b
AZURE_TENANT_ID = 75a0aac9-9542-45cd-8a40-b3a815e2e37a
AZURE_SUBSCRIPTION_ID = cfa5e3dc-3e95-4579-8538-301d0feadd21
```

### 2. OIDC（Federated Identity）の利点
- 🔒 **セキュリティ強化**: 長期間有効なシークレット不要
- 🔄 **自動ローテーション**: トークンの自動期限切れ
- 🎯 **細かい制御**: 特定ブランチ・PR限定アクセス

### 3. App Service設定確認
- **App Service名**: `teios-ai-webui-iymm4la6qt4mo`
- **リソースグループ**: `teios-ai-rg`
- **ランタイム**: Node.js 20 LTS
- **開始コマンド**: `node server.js`

## 🎯 使用方法

### ローカル開発
```bash
npm run dev          # 開発サーバー
npm run ci           # 全CIチェック実行
npm run format       # コード整形
npm run lint         # リント実行
npm run type-check   # 型チェック
```

### デプロイフロー
1. `develop`ブランチで開発 → CI実行のみ
2. PRでmainにマージ → CI + CD実行
3. 自動デプロイ → https://teios-ai-webui-iymm4la6qt4mo.azurewebsites.net

## 🔍 監視・確認方法

### GitHub Actions
- リポジトリの「Actions」タブで実行状況確認
- ワークフロー名: "CI/CD Pipeline"

### Azure App Service
```bash
# ログ確認
az webapp log tail --name teios-ai-webui-iymm4la6qt4mo --resource-group teios-ai-rg

# ヘルスチェック
curl https://teios-ai-webui-iymm4la6qt4mo.azurewebsites.net/health
```

## 🎉 準備完了！
GitHub Secretsを設定すれば、mainブランチにプッシュ時に自動デプロイが開始されます。

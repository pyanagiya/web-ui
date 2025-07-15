# 🔧 GitHub Secrets設定ガイド

## GitHub Actionsエラーの解決

現在、GitHub ActionsでOIDC認証に必要なSecretsが設定されていないため、デプロイが失敗しています。

### 📋 設定手順

1. **GitHubリポジトリに移動**
   - https://github.com/pyanagiya/web-ui

2. **Settings > Secrets and variables > Actions に移動**

3. **「New repository secret」をクリックして、以下の3つのSecretを追加**

### 🔑 必要なSecrets

```
Name: AZURE_CLIENT_ID
Value: 4a592fb1-77b4-4fb0-aa80-630c8ca9801b
```

```
Name: AZURE_TENANT_ID
Value: 75a0aac9-9542-45cd-8a40-b3a815e2e37a
```

```
Name: AZURE_SUBSCRIPTION_ID
Value: cfa5e3dc-3e95-4579-8538-301d0feadd21
```

### 📸 設定画面での操作

1. **AZURE_CLIENT_ID** を追加：
   - Name: `AZURE_CLIENT_ID`
   - Secret: `4a592fb1-77b4-4fb0-aa80-630c8ca9801b`
   - 「Add secret」をクリック

2. **AZURE_TENANT_ID** を追加：
   - Name: `AZURE_TENANT_ID`
   - Secret: `75a0aac9-9542-45cd-8a40-b3a815e2e37a`
   - 「Add secret」をクリック

3. **AZURE_SUBSCRIPTION_ID** を追加：
   - Name: `AZURE_SUBSCRIPTION_ID`
   - Secret: `cfa5e3dc-3e95-4579-8538-301d0feadd21`
   - 「Add secret」をクリック

### ✅ 設定後の確認

設定完了後、再度mainブランチにプッシュするか、GitHubの「Actions」タブから手動でワークフローを実行してください。

```bash
# 再実行のためのダミーコミット
git commit --allow-empty -m "trigger: GitHub Actions再実行"
git push origin main
```

### 🔒 セキュリティ情報

これらのSecretsは以下の通り設定されています：
- **OIDC認証**: パスワードやキーの代わりに短期間有効なトークンを使用
- **スコープ制限**: 特定のリポジトリとブランチからのみアクセス可能
- **最小権限**: App Serviceのリソースグループに対してのみContributor権限

### 🌍 Production環境の設定

GitHub Actionsではdeploy時に "Production" 環境を使用します。以下の手順で環境を設定してください：

1. **GitHubリポジトリの Settings > Environments に移動**
2. **「New environment」をクリック**
3. **環境名** に `Production` を入力
4. **「Configure environment」をクリック**
5. 必要に応じて **Environment protection rules** を設定：
   - Required reviewers (承認者設定)
   - Deployment branches (mainブランチのみ許可)

### 🔧 追加されたFederated Identity Credentials

以下のCredentialsが設定されています：
- **Main Branch**: `repo:pyanagiya/web-ui:ref:refs/heads/main`
- **Pull Request**: `repo:pyanagiya/web-ui:pull_request`
- **Production Environment**: `repo:pyanagiya/web-ui:environment:Production` ← 新規追加

### 🚀 期待される結果

Secrets設定後、GitHub Actionsで以下が成功するはずです：
- ✅ CI (Continuous Integration)
- ✅ Build (プロダクションビルド)
- ✅ Deploy (Azure App Serviceへのデプロイ)
- ✅ Health Check (デプロイ後確認)

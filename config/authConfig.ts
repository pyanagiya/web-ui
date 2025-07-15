/**
 * Azure ADの設定
 */
export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    navigateToLoginRequestUrl: false, // falseに変更して無限リダイレクトを防ぐ
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'localStorage', // LocalStorageを使用してトークンを永続化
    storeAuthStateInCookie: true,  // ブラウザのクッキーにも認証状態を保存
    secureCookies: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false, // HTTPSの場合のみtrue
    claimsBasedCachingEnabled: true, // より効率的なキャッシング
  },
  system: {
    allowRedirectInIframe: false, // セキュリティのためfalseに変更
    loggerOptions: {
      loggerCallback: (level: number, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error('[MSAL Error]', message);
            return;
          case 1: // Warning
            console.warn('[MSAL Warning]', message);
            return;
          case 2: // Info
            console.info('[MSAL Info]', message);
            return;
          case 3: // Verbose
            console.debug('[MSAL Debug]', message);
            return;
        }
      },
      logLevel: 2, // INFO
    }
  }
};

/**
 * アプリケーションで使用するスコープ（Microsoft Graph用）
 */
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"]
};

/**
 * バックエンドAPIのスコープ（APIが必要とする場合）
 */
export const apiRequest = {
  scopes: [process.env.NEXT_PUBLIC_AZURE_API_SCOPE || "api://9c2804fa-5504-4312-ba36-ee5987b9400a/user_impersonation"]
};

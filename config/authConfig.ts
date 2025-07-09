/**
 * Azure ADの設定
 */
export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInIframe: true,
    loggerOptions: {
      loggerCallback: (level: number, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error(message);
            return;
          case 1: // Warning
            console.warn(message);
            return;
          case 2: // Info
            console.info(message);
            return;
          case 3: // Verbose
            console.debug(message);
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

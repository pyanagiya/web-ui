/**
 * 認証デバッグ用ユーティリティ
 */

export function debugAuthState() {
  if (typeof window === 'undefined') return;
  
  console.log('🔍 認証状態デバッグ:', {
    location: window.location.href,
    origin: window.location.origin,
    protocol: window.location.protocol,
    localStorage: {
      hasAuthToken: !!localStorage.getItem('auth_token'),
      hasMsalAccount: !!localStorage.getItem('msal.account.keys'),
      hasAuthState: !!localStorage.getItem('authState'),
    },
    cookies: document.cookie,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
  
  // MSALの状態をチェック
  const msalKeys = Object.keys(localStorage).filter(key => key.startsWith('msal.'));
  console.log('📋 MSAL LocalStorage keys:', msalKeys);
  
  // 認証エラーがあればログ出力
  const authError = localStorage.getItem('auth_error');
  if (authError) {
    console.error('❌ 認証エラー:', authError);
  }
}

// デバッグ用: ブラウザコンソールで使用可能にする
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthState;
}

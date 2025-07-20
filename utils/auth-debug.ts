/**
 * 認証デバッグ用ユーティリティ
 */

import { API_BASE_URL } from './api';

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

// バックエンドサーバーへの接続テスト
export async function testBackendConnection() {
  if (typeof window === 'undefined') return;
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  try {
    console.log('🔗 バックエンドサーバー接続テスト開始...');
    console.log('🔗 Base URL:', baseUrl);
    
    // ヘルスチェック
    const healthResponse = await fetch(`${baseUrl}/api/v1/health`);
    console.log('💚 ヘルスチェック:', healthResponse.status, healthResponse.statusText);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('💚 ヘルスチェック結果:', healthData);
    }
    
    // 認証が必要なエンドポイントのテスト
    const authToken = localStorage.getItem('auth_token') || getAzureAdToken();
    
    if (authToken) {
      console.log('🔐 認証トークンあり - 認証テスト実行');
      const authResponse = await fetch(`${baseUrl}/api/v1/documents`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔐 認証テスト結果:', authResponse.status, authResponse.statusText);
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('🔐 認証テスト データ:', authData);
      } else {
        const errorData = await authResponse.text();
        console.log('🔐 認証テスト エラー:', errorData);
      }
    } else {
      console.log('🔐 認証トークンなし');
    }
    
  } catch (error) {
    console.error('❌ バックエンドサーバー接続エラー:', error);
  }
}

// Azure ADトークンを取得
function getAzureAdToken() {
  try {
    const msalKeys = Object.keys(localStorage).filter(key => key.includes('accesstoken'));
    if (msalKeys.length > 0) {
      const tokenKey = msalKeys[0];
      const tokenData = localStorage.getItem(tokenKey);
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        return parsed.secret;
      }
    }
  } catch (error) {
    console.error('Azure ADトークン取得エラー:', error);
  }
  return null;
}

// デバッグ用: ブラウザコンソールで使用可能にする
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthState;
  (window as any).testBackend = testBackendConnection;
}

/**
 * 認証API クライアント（Azure AD対応）
 */
import { fetchAPI, API_BASE_URL } from './api';
import { MsalAuthenticationResult } from '@azure/msal-react';

export interface User {
  id: string;
  username: string;
  name?: string; // Azure ADのdisplayNameやname
  displayName?: string; // Azure ADのdisplayName
  email: string;
  role: string;
  avatar_url?: string;
  department?: string | { id: string; name: string; code: string };
  created_at: string;
  updated_at: string;
  // Azure AD関連の追加フィールド
  oid?: string; // Azure ADのObject ID
  tid?: string; // Azure ADのTenant ID
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

/**
 * Azure ADログイン後の認証結果をバックエンドに送信して、
 * システム独自のトークンを取得する
 * 
 * @param tokenInfo Azure ADから取得したトークン情報
 */
export async function loginWithAzureAD(tokenInfo: { accessToken: string; account?: any }): Promise<AuthResponse> {
  // Azure ADから取得したアクセストークンをバックエンドに送信
  const accessToken = tokenInfo.accessToken;
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/azure-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        access_token: accessToken,
        account_info: tokenInfo.account // 追加のアカウント情報があれば送信
      }),
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || 'Azure ADログインに失敗しました';
      } catch (e) {
        errorMessage = `ログインエラー: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // バックエンドの応答構造に応じてデータを抽出
    let authResponse: AuthResponse;
    if (data.data) {
      // 新しい構造: { success: true, data: { access_token, user, ... } }
      authResponse = data.data;
    } else {
      // 古い構造: { access_token, user, ... }
      authResponse = data;
    }
    
    // トークンをローカルストレージに保存
    if (authResponse.access_token) {
      localStorage.setItem('auth_token', authResponse.access_token);
    }
    
    return authResponse;
  } catch (error) {
    console.error('loginWithAzureAD エラー:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('バックエンドサーバーに接続できません。サーバーが起動していることを確認してください。');
    }
    throw error;
  }
}

/**
 * ログアウト処理
 */
export async function logout(): Promise<void> {
  try {
    // バックエンドのログアウトAPIを呼び出し
    await fetchAPI('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
    // エラーが発生しても続行（少なくともローカルのトークンはクリア）
  } finally {
    // ローカルストレージからトークンを削除
    localStorage.removeItem('auth_token');
  }
}

/**
 * 現在のユーザー情報取得
 */
export async function getCurrentUser(): Promise<User> {
  const response = await fetchAPI<{ data: User }>('/auth/me');
  return response.data;
}

/**
 * アクセストークンの検証
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    // verify-tokenの代わりに/auth/meエンドポイントを使用してトークンを検証
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * ユーザーがログイン済みかチェック
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return false;
  }
  
  return await validateToken(token);
}

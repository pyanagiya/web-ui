'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, logout as apiLogout, getCurrentUser, isAuthenticated, loginWithAzureAD } from '@/utils/auth-api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  PublicClientApplication, 
  EventType, 
  EventMessage, 
  AuthenticationResult 
} from '@azure/msal-browser';
import { 
  MsalProvider, 
  useMsal, 
  useIsAuthenticated as useMsalAuthenticated 
} from '@azure/msal-react';
import { msalConfig, loginRequest, apiRequest } from '@/config/authConfig';

// MsalAuthenticationResult型定義
export interface MsalAuthenticationResult {
  accessToken: string;
  idToken?: string;
  account?: {
    homeAccountId: string;
    environment: string;
    tenantId: string;
    username: string;
  };
  scopes?: string[];
  expiresOn?: Date;
}

// MSALインスタンスを作成
export const msalInstance = new PublicClientApplication(msalConfig);

// リダイレクト認証のハンドラを登録
if (typeof window !== 'undefined') {
  // MSALの初期化とリダイレクト処理
  msalInstance.initialize().then(() => {
    console.log('✅ MSAL初期化完了');
    
    // リダイレクトコールバックの処理
    msalInstance.handleRedirectPromise()
      .then((response) => {
        if (response) {
          console.log('✅ リダイレクト認証の結果を取得:', response);
        }
        
        // アカウントが存在する場合、アクティブアカウントを設定
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const activeAccount = msalInstance.getActiveAccount();
          if (!activeAccount) {
            msalInstance.setActiveAccount(accounts[0]);
            console.log('✅ アクティブアカウントを設定:', accounts[0].username);
          }
        }
      })
      .catch(error => {
        console.error('❌ リダイレクト認証の処理中にエラーが発生しました:', error);
      });
  }).catch(error => {
    console.error('❌ MSAL初期化エラー:', error);
  });
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithAzureAD: () => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 内部コンポーネント - MSAL Contextを使うため
function AuthProviderContent({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // 認証処理中フラグ
  const [isLoggedOut, setIsLoggedOut] = useState(false); // ログアウト完了フラグ
  const router = useRouter();
  const { instance, accounts } = useMsal();
  const isMsalAuthenticated = useMsalAuthenticated();
  
  // アプリ起動時に認証状態を確認
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('🔄 認証チェック開始', {
        isMsalAuthenticated,
        accountsLength: accounts.length,
        localToken: !!localStorage.getItem('auth_token'),
        isLoggedOut,
        currentPath: window.location.pathname
      });
      
      // ログインページにいる場合はログアウトフラグをリセット
      if (window.location.pathname === '/login') {
        setIsLoggedOut(false);
        setIsLoading(false);
        return;
      }
      
      // ログアウト完了フラグがある場合はスキップ
      if (isLoggedOut) {
        console.log('⏭️ ログアウト完了済みのため認証チェックをスキップ');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // まずMSALアカウントの存在を確認
        const allAccounts = instance.getAllAccounts();
        console.log('🔍 MSAL全アカウント数:', allAccounts.length);
        
        if (allAccounts.length === 0) {
          console.log('❌ MSALアカウントなし、未認証状態');
          setUser(null);
          localStorage.removeItem('auth_token');
          setIsLoading(false);
          return;
        }
        
        // アクティブアカウントを設定
        const activeAccount = instance.getActiveAccount() || allAccounts[0];
        if (!instance.getActiveAccount()) {
          instance.setActiveAccount(activeAccount);
          console.log('✅ アクティブアカウントを設定:', activeAccount.username);
        }
        
        // ローカルストレージのトークンとバックエンド認証状態を確認
        const localToken = localStorage.getItem('auth_token');
        console.log('🔍 ローカルトークン:', !!localToken);
        
        // バックエンドの認証状態を確認
        let isAuth = false;
        if (localToken) {
          try {
            isAuth = await isAuthenticated();
            console.log('🔍 バックエンド認証状態:', isAuth);
          } catch (error) {
            console.log('❌ バックエンド認証チェック失敗:', error);
            // ローカルトークンを削除
            localStorage.removeItem('auth_token');
          }
        }
        
        if (isAuth) {
          // 既に認証済みの場合、ユーザー情報を取得
          console.log('✅ 認証済み、ユーザー情報取得中...');
          try {
            // まずローカルストレージから復元を試行
            const savedUserData = localStorage.getItem('user_data');
            if (savedUserData) {
              try {
                const parsedUserData = JSON.parse(savedUserData);
                setUser(parsedUserData);
                console.log('✅ ローカルストレージからユーザー情報復元:', parsedUserData.username);
                
                // バックグラウンドで最新のユーザー情報を取得して更新
                getCurrentUser().then(freshUserData => {
                  setUser(freshUserData);
                  localStorage.setItem('user_data', JSON.stringify(freshUserData));
                  console.log('✅ ユーザー情報を最新に更新:', freshUserData.username);
                }).catch(error => {
                  console.warn('ユーザー情報の更新に失敗（既存データを保持）:', error);
                });
                
                return; // 早期リターン
              } catch (parseError) {
                console.warn('ローカルストレージのユーザーデータの解析に失敗:', parseError);
                localStorage.removeItem('user_data');
              }
            }
            
            // ローカルストレージにデータがない場合はAPIから取得
            const userData = await getCurrentUser();
            setUser(userData);
            localStorage.setItem('user_data', JSON.stringify(userData));
            console.log('✅ ユーザー情報取得・保存成功:', userData.username);
          } catch (error) {
            console.error('❌ ユーザー情報取得失敗:', error);
            // ユーザー情報取得に失敗した場合、再認証が必要
            await performReAuthentication(activeAccount);
          }
        } else {
          // 認証が無効またはない場合、MSALアカウントがあれば再認証を試行
          console.log('❌ バックエンド認証無効、再認証を試行中...');
          await performReAuthentication(activeAccount);
        }
      } catch (error) {
        console.error('❌ 認証チェックエラー:', error);
        // エラーが発生した場合はキャッシュをクリア
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('🏁 認証チェック完了');
      }
    };

    // MSALの初期化を待ってから認証チェックを実行
    const initializeAndCheck = async () => {
      try {
        await instance.initialize();
        // 少し待ってからチェック（MSALの完全な初期化を待つ）
        setTimeout(checkAuthentication, 100);
      } catch (error) {
        console.error('❌ MSAL初期化エラー:', error);
        setIsLoading(false);
      }
    };

    initializeAndCheck();
  }, [instance, isLoggedOut]);
  
  // 再認証処理
  const performReAuthentication = async (account: any) => {
    try {
      console.log('🔄 再認証開始 for account:', account.username);
      
      // API用トークンをサイレントで取得
      const silentRequest = {
        scopes: apiRequest.scopes,
        account: account
      };
      
      const response = await instance.acquireTokenSilent(silentRequest);
      console.log('✅ API用トークンのサイレント取得成功');
      
      await handleAzureAuthResult(response);
      console.log('✅ 再認証完了');
    } catch (error) {
      console.error('❌ 再認証失敗:', error);
      // 再認証に失敗した場合はログアウト状態にする
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  };
  
  // Azure AD認証結果の処理
  const handleAzureAuthResult = async (response: AuthenticationResult) => {
    console.log('🚀 handleAzureAuthResult開始', {
      hasAccount: !!response.account,
      accountUsername: response.account?.username,
      accountId: response.account?.homeAccountId
    });
    
    try {
      // バックエンドAPI用のトークンを取得
      console.log('🚀 API用トークンを取得開始...');
      let apiToken;
      
      try {
        // apiRequestのスコープでトークンを取得
        const apiTokenResponse = await instance.acquireTokenSilent({
          scopes: apiRequest.scopes,
          account: response.account
        });
        apiToken = apiTokenResponse.accessToken;
        console.log('🚀 ✅ API用トークン取得成功');
      } catch (apiTokenError) {
        console.error('🚀 ❌ API用トークンの取得に失敗:', apiTokenError);
        // フォールバック: ポップアップでAPI用トークンを取得
        try {
          console.log('🚀 ポップアップでAPI用トークンを再取得...');
          const apiTokenResponse = await instance.acquireTokenPopup({
            scopes: apiRequest.scopes,
            account: response.account
          });
          apiToken = apiTokenResponse.accessToken;
          console.log('✅ API用トークン取得成功');
        } catch (popupError) {
          console.error('ポップアップでのAPI用トークン取得も失敗:', popupError);
          throw new Error('バックエンドAPI用のトークンを取得できませんでした');
        }
      }
      
      // AuthenticationResultからMsalAuthenticationResult形式に変換
      const msalAuthResult: MsalAuthenticationResult = {
        accessToken: apiToken,
        account: response.account
      };
      
      const authResponse = await loginWithAzureAD(msalAuthResult);
      setUser(authResponse.user);
      localStorage.setItem('user_data', JSON.stringify(authResponse.user));
      console.log('✅ バックエンド認証完了、ユーザー情報設定:', authResponse.user.username);
      toast.success('Azure ADでログインしました');
      return authResponse;
    } catch (error: any) {
      console.error('バックエンドの認証処理に失敗:', error);
      toast.error(`ログインに失敗しました: ${error.message}`);
      throw error;
    }
  };

  // Azure ADログイン処理
  const handleLoginWithAzureAD = async () => {
    setIsLoading(true);
    setIsAuthenticating(true); // 明示的ログイン時もフラグ設定
    setIsLoggedOut(false); // ログアウトフラグをリセット
    try {
      let response;
      try {
        // まずMicrosoft Graph用でログイン
        response = await instance.loginPopup(loginRequest);
      } catch (popupError: any) {
        console.warn('ポップアップログインに失敗しました。リダイレクトログインを試みます:', popupError);
        // ポップアップが失敗した場合、リダイレクトを試みる
        instance.loginRedirect(loginRequest);
        return; // リダイレクト後はこの関数から抜ける
      }
      
      console.log('🔄 handleAzureAuthResult呼び出し開始 (明示的ログイン)');
      // ログイン成功後、API用トークンも取得して認証処理
      return await handleAzureAuthResult(response);
    } catch (error: any) {
      console.error('Azure ADログインエラー:', error);
      toast.error(`ログインに失敗しました: ${error.message || 'Azure AD認証エラー'}`);
      throw error;
    } finally {
      setIsLoading(false);
      setIsAuthenticating(false); // 明示的ログイン完了時もフラグリセット
    }
  };

  // ログアウト処理
  const logout = async () => {
    setIsLoading(true);
    try {
      // ログアウト完了フラグを設定（認証チェックをスキップするため）
      setIsLoggedOut(true);
      
      // ユーザー状態をすぐにクリア（画面から即座に消すため）
      setUser(null);
      
      // ローカルストレージからトークンを削除
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      // SessionStorageも念のためクリア
      sessionStorage.clear();
      
      // バックエンドからログアウト
      try {
        await apiLogout();
      } catch (error) {
        // バックエンドエラーは無視して続行
      }
      
      // MSALアカウントとキャッシュをクリア（ポップアップなしでサイレントクリア）
      try {
        const accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
          // アクティブアカウントをクリア
          instance.setActiveAccount(null);
        }
        
        // ブラウザのキャッシュとセッションをクリア
        try {
          // MSALキャッシュをクリア
          await instance.clearCache();
        } catch (clearError) {
          // キャッシュクリアエラーは無視
        }
      } catch (error) {
        // MSALエラーは無視して続行
      }
      
      toast.info('ログアウトしました');
      
      // 確実にログインページにリダイレクト
      window.location.href = '/login';
      
    } catch (error) {
      console.error('ログアウトエラー:', error);
      
      // エラーが発生してもユーザー状態をクリアしてログインページに移動
      setIsLoggedOut(true);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      sessionStorage.clear();
      
      toast.error('ログアウト処理中にエラーが発生しました');
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  // 認証状態確認
  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('🔍 checkAuth開始', { 
        accountsLength: accounts.length,
        isAuthenticating,
        hasUser: !!user,
        hasLocalToken: !!localStorage.getItem('auth_token')
      });

      // 認証処理中の場合はスキップ
      if (isAuthenticating) {
        console.log('⏳ 認証処理中のためスキップ');
        return false;
      }

      // MSALアカウントの確認（useMsalのaccountsではなく直接MSALから取得）
      const allAccounts = instance.getAllAccounts();
      if (allAccounts.length === 0) {
        console.log('❌ MSALアカウントなし');
        return false;
      }
      
      // ユーザー情報が既にある場合は、バックエンド認証のみチェック
      if (user) {
        const isAuth = await isAuthenticated();
        console.log('🔍 既存ユーザーの認証状態:', isAuth);
        return isAuth;
      }
      
      const isAuth = await isAuthenticated();
      console.log('🔍 バックエンド認証状態:', isAuth);
      
      if (!isAuth) {
        // 認証処理中フラグを設定
        setIsAuthenticating(true);
        
        try {
          // アクティブアカウントを確保
          const activeAccount = instance.getActiveAccount() || allAccounts[0];
          if (!instance.getActiveAccount()) {
            instance.setActiveAccount(activeAccount);
          }
          
          // バックエンド認証がない場合、API用トークンを取得してバックエンドに送信
          const silentRequest = {
            scopes: apiRequest.scopes,
            account: activeAccount
          };
          
          console.log('🔄 API用トークンをサイレント取得中...');
          const response = await instance.acquireTokenSilent(silentRequest);
          console.log('✅ API用トークンサイレント取得成功');
          await handleAzureAuthResult(response);
          
          // 再度認証状態を確認
          const finalAuthResult = await isAuthenticated();
          console.log('🔍 最終認証状態:', finalAuthResult);
          return finalAuthResult;
        } catch (error) {
          console.error('❌ API用トークン取得失敗:', error);
          return false;
        } finally {
          // 認証処理完了フラグをリセット
          setIsAuthenticating(false);
        }
      }
      
      if (isAuth && !user) {
        try {
          console.log('🔄 ユーザー情報取得中...');
          const userData = await getCurrentUser();
          setUser(userData);
          localStorage.setItem('user_data', JSON.stringify(userData));
          console.log('✅ ユーザー情報取得成功:', userData.username);
        } catch (error) {
          console.error('❌ ユーザー情報取得失敗:', error);
          return false;
        }
      }
      
      console.log('✅ checkAuth完了:', isAuth);
      return isAuth;
    } catch (error) {
      console.error('❌ 認証チェックエラー:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithAzureAD: handleLoginWithAzureAD,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// MsalProviderでラップした最終的なAuthProvider
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderContent>
        {children}
      </AuthProviderContent>
    </MsalProvider>
  );
}

// カスタムフック
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      // 認証チェックが既に完了している場合はスキップ
      if (authCheckCompleted) {
        return;
      }

      // AuthContextの初期化が完了するまで待機
      if (isLoading) {
        return;
      }

      // ローカルストレージにトークンがない場合は即座にログインページにリダイレクト
      const localToken = localStorage.getItem('auth_token');
      if (!localToken) {
        console.log('❌ ProtectedRoute: ローカルトークンなし、即座にログインページへリダイレクト');
        router.push('/login');
        return;
      }

      console.log('🔍 ProtectedRoute: 認証チェック開始', { user: !!user, isLoading });

      try {
        setIsChecking(true);
        const isAuthenticated = await checkAuth();
        
        console.log('🔍 ProtectedRoute: 認証チェック結果', { isAuthenticated, user: !!user });
        
        if (!isAuthenticated) {
          console.log('❌ ProtectedRoute: 認証失敗、ログインページへリダイレクト');
          router.push('/login');
        } else {
          console.log('✅ ProtectedRoute: 認証成功');
          setAuthCheckCompleted(true);
        }
      } catch (error) {
        console.error('❌ ProtectedRoute: 認証チェックでエラー:', error);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [isLoading, user, checkAuth, router, authCheckCompleted]);

  // 認証チェック中または初期化中はローディング表示
  if (isLoading || (isChecking && !authCheckCompleted)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'システム初期化中...' : 'ログイン状態を確認中...'}
          </p>
        </div>
      </div>
    );
  }

  // 認証チェックが完了していて、ユーザー情報がない場合もローディング
  if (authCheckCompleted && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">ユーザー情報を取得中...</p>
        </div>
      </div>
    );
  }

  // ユーザーが認証されている場合、子コンポーネントを表示
  return <>{children}</>;
}

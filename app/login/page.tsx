'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Shield } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithAzureAD } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('🔄 ログイン処理開始');
      await loginWithAzureAD();
      console.log('✅ ログイン成功、ホームページにリダイレクト');
      
      // 少し待ってからリダイレクト（状態更新を待つ）
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (err: any) {
      console.error('❌ ログイン失敗:', err);
      setError(err.message || 'Azure ADログインに失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">TEIOSシステム</CardTitle>
          <CardDescription className="text-center">
            Azure Active Directory を使用してログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-center">
            <Button 
              onClick={handleLogin} 
              className="w-full py-6"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> ログイン中...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Microsoft Azureでログイン
                </>
              )}
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Information
              </span>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>会社のMicrosoftアカウントを使用してログインします。</p>
            <p>アカウントについてご不明な点は、システム管理者にお問い合わせください。</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-xs text-muted-foreground w-full">
            このシステムは会社の機密情報を含むため、アクセス権のある社員のみ利用できます。
          </p>
          <p className="text-center text-xs text-muted-foreground w-full">
            &copy; {new Date().getFullYear()} TEIOS Corporation
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

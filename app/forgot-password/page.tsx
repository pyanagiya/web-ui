'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, HelpCircle, Mail, Shield } from 'lucide-react';

export default function LoginHelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">ログインサポート</CardTitle>
          <CardDescription className="text-center">
            Azure Active Directory ログインでお困りですか？
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              このシステムはMicrosoft Azure Active Directoryで認証を行います。
              会社のMicrosoftアカウント（メールアドレスとパスワード）でログインしてください。
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <h3 className="font-medium text-lg">よくある質問</h3>
            
            <div>
              <h4 className="font-medium">パスワードを忘れた場合</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Microsoftアカウントのパスワードをリセットするには、Microsoft公式のパスワードリセットページを利用してください。
                または、IT部門にお問い合わせください。
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">アカウントがロックされた場合</h4>
              <p className="text-sm text-muted-foreground mt-1">
                何度もパスワードを間違えるとアカウントがロックされる場合があります。
                IT部門に連絡して、アカウントのロック解除をリクエストしてください。
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">アクセス権がない場合</h4>
              <p className="text-sm text-muted-foreground mt-1">
                このシステムを利用するには適切なアクセス権が必要です。
                アクセス権のリクエストは管理者または上長を通じて行ってください。
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              <Shield className="mr-2 h-4 w-4" />
              ログインページに戻る
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('https://account.live.com/ResetPassword.aspx', '_blank')}
              className="w-full"
            >
              Microsoftパスワードリセットページへ
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-xs text-muted-foreground w-full">
            IT部門サポート: support@example.com | 内線: 1234
          </p>
          <p className="text-center text-xs text-muted-foreground w-full">
            &copy; {new Date().getFullYear()} TEIOS Corporation
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

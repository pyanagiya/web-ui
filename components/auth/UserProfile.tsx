'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  // ユーザー表示名を取得する関数
  const getDisplayName = () => {
    // Azure ADから複数の可能性のあるプロパティをチェック
    // より良い表示名の優先順位で選択
    return user.displayName || user.name || user.username || user.email?.split('@')[0] || 'ユーザー';
  };

  // ユーザー名の頭文字を取得（アバターのフォールバック用）
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'U'; // デフォルトとして'U'を返す
    }
    try {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    } catch (error) {
      console.error('getInitials エラー:', error);
      return 'U';
    }
  };

  // 部署情報を安全に取得する関数
  const getDepartmentName = (department: any) => {
    if (!department) return null;
    if (typeof department === 'string') return department;
    if (typeof department === 'object' && department.name) return department.name;
    return null;
  };

  const displayName = getDisplayName();

  // ログアウト処理（追加の安全措置付き）
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウト処理エラー:', error);
      // エラーが発生してもログインページに強制リダイレクト
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex items-center gap-1 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-auto flex-1 justify-start p-0 hover:bg-transparent"
          >
            <div className="flex items-center gap-2 w-full min-w-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user.avatar_url || ''} alt={displayName} />
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 text-left overflow-hidden min-w-0">
                <p className="text-sm font-medium truncate leading-tight">
                  {displayName || 'ユーザー'}
                </p>
                {user.email && (
                  <p className="text-xs text-muted-foreground truncate leading-tight">
                    {user.email}
                  </p>
                )}
                {getDepartmentName(user.department) && (
                  <p className="text-xs text-muted-foreground/80 truncate leading-tight">
                    {getDepartmentName(user.department)}
                  </p>
                )}
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 max-h-80 overflow-y-auto" align="end" forceMount sideOffset={5}>
        <DropdownMenuLabel className="pb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user.avatar_url || ''} alt={displayName} />
              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate">
                {displayName || 'ユーザー'}
              </p>
              {user.email && (
                <p className="text-xs text-muted-foreground leading-tight truncate">
                  {user.email}
                </p>
              )}
              {getDepartmentName(user.department) && (
                <p className="text-xs text-muted-foreground leading-tight truncate">
                  {getDepartmentName(user.department)}
                </p>
              )}
              {user.role && (
                <p className="text-xs text-muted-foreground leading-tight truncate">
                  {user.role}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <UserIcon className="mr-2 h-4 w-4" />
          <span>プロフィール設定</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>ログアウト</span>
        </DropdownMenuItem>        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
        title="ログアウト"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

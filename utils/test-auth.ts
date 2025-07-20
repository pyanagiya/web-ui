/**
 * 認証テスト用ユーティリティ
 */

export async function testAuthentication() {
  console.log('🔍 認証テスト開始...');
  
  // ローカルストレージの認証情報を確認
  const authToken = localStorage.getItem('auth_token');
  const authState = localStorage.getItem('authState');
  const userData = localStorage.getItem('user_data');
  
  console.log('📋 ローカルストレージ情報:', {
    hasAuthToken: !!authToken,
    authTokenLength: authToken ? authToken.length : 0,
    authTokenStart: authToken ? authToken.substring(0, 30) + '...' : 'なし',
    hasAuthState: !!authState,
    hasUserData: !!userData
  });
  
  if (!authToken) {
    console.error('❌ 認証トークンが見つかりません');
    return false;
  }
  
  // バックエンドAPIの認証テスト
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    console.log('🔄 認証テストリクエスト送信...');
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 認証テストレスポンス:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (response.ok) {
      const userInfo = await response.json();
      console.log('✅ 認証成功! ユーザー情報:', userInfo);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ 認証失敗:', errorData);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 認証テストエラー:', error);
    return false;
  }
}

/**
 * ファイルアップロード用の認証テスト
 */
export async function testUploadAuthentication() {
  console.log('📤 アップロード認証テスト開始...');
  
  const authToken = localStorage.getItem('auth_token');
  if (!authToken) {
    console.error('❌ 認証トークンが見つかりません');
    return false;
  }
  
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // テスト用の小さなファイルを作成
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('title', 'Test Upload');
    formData.append('confidentiality_level', 'internal');
    formData.append('tags', 'テスト');
    
    console.log('🔄 テストアップロードリクエスト送信...');
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
        // Content-TypeはFormDataが自動設定
      },
      body: formData
    });
    
    console.log('📥 アップロードテストレスポンス:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ アップロード認証成功!', result);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ アップロード認証失敗:', errorData);
      return false;
    }
    
  } catch (error) {
    console.error('❌ アップロード認証テストエラー:', error);
    return false;
  }
}

// デバッグ用: ブラウザのコンソールで使用可能にする
if (typeof window !== 'undefined') {
  (window as any).testAuth = testAuthentication;
  (window as any).testUploadAuth = testUploadAuthentication;
}

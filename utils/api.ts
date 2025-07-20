/**
 * API クライアントユーティリティ
 */

// APIのベースURL（環境変数から取得または本番用のデフォルト値）
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// デバッグ情報をログ出力
console.log('🔍 API_BASE_URL デバッグ情報:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  window_location: typeof window !== 'undefined' ? window.location.origin : 'SSR'
});

// 接続状態の追跡
let lastConnectionCheck = 0;
let isConnected = false;

/**
 * バックエンドサーバーへの接続確認
 */
export async function checkBackendConnection(): Promise<boolean> {
  // 1分以内に確認済みの場合はキャッシュを使用
  const now = Date.now();
  if (now - lastConnectionCheck < 60000) {
    return isConnected;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // タイムアウトを10秒に設定
      signal: AbortSignal.timeout(10000),
    });
    
    isConnected = response.ok;
    lastConnectionCheck = now;
    
    console.log(`🔍 バックエンド接続確認: ${isConnected ? 'OK' : 'NG'} (${API_BASE_URL})`);
    return isConnected;
  } catch (error) {
    console.error('🔍 バックエンド接続確認エラー:', error);
    isConnected = false;
    lastConnectionCheck = now;
    return false;
  }
}

/**
 * API呼び出しのための基本設定を含むfetch関数
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Azure ADの認証トークンの取得
  let token = null;
  
  if (typeof window !== 'undefined') {
    // AuthContextから認証情報を取得
    const authState = localStorage.getItem('authState');
    if (authState) {
      try {
        const parsedAuthState = JSON.parse(authState);
        if (parsedAuthState.accessToken) {
          token = parsedAuthState.accessToken;
        }
      } catch (error) {
        console.warn('Failed to parse auth state:', error);
      }
    }
    
    // フォールバック: 通常のauth_tokenを確認
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
  }
  
  // ヘッダーの設定
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // リクエスト実行
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('🔍 fetchAPI - 送信URL:', fullUrl);
  console.log('🔍 fetchAPI - API_BASE_URL:', API_BASE_URL);
  console.log('🔍 fetchAPI - endpoint:', endpoint);
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // エラーハンドリング
    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.detail || 'APIリクエストエラー';
      } catch (e) {
        errorMessage = `APIリクエストエラー: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // 正常なレスポンスの場合
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('バックエンドサーバーに接続できません。サーバーが起動していることを確認してください。');
    }
    throw error;
  }
}

/**
 * ファイルアップロードAPI
 */
export async function uploadDocuments(
  files: File[],
  metadata?: Record<string, any>
): Promise<{ documentIds: string[] }> {
  const formData = new FormData();
  
  // ファイルの追加
  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });
  
  // メタデータがある場合は追加
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }
  
  // リクエストヘッダーからContent-Typeを削除（FormDataが自動的に設定）
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: 'POST',
    body: formData,
    headers,
  });
  
  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.detail || 'ドキュメントアップロードエラー';
    } catch (e) {
      errorMessage = `ドキュメントアップロードエラー: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  return response.json().then(data => data.data);
}

/**
 * ドキュメント一覧取得API
 */
export async function getDocuments(params: {
  department?: string;
  document_type?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
} = {}) {
  // クエリパラメータの構築
  const queryParams = new URLSearchParams();
  
  if (params.department) queryParams.append('department', params.department);
  if (params.document_type) queryParams.append('document_type', params.document_type);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.order) queryParams.append('order', params.order);
  
  const queryString = queryParams.toString();
  
  return fetchAPI(`/api/v1/documents${queryString ? `?${queryString}` : ''}`);
}

/**
 * ドキュメント削除API
 */
export async function deleteDocument(documentId: string) {
  return fetchAPI(`/api/v1/documents/${documentId}`, { method: 'DELETE' });
}

/**
 * ヘルスチェックAPI
 */
export async function checkApiHealth() {
  return fetchAPI('/api/v1/health');
}

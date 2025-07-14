/**
 * API クライアントユーティリティ
 */

// APIのベースURL（環境変数から取得または開発用のデフォルト値）
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    // デバッグモード: テスト用トークンを使用
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsIm9pZCI6InRlc3Qtb2JqZWN0LWlkLTQ1NiIsImV4cCI6MTc1MjQyMzAxOSwiaWF0IjoxNzUyNDE5NDE5fQ.IGX3Ix4SAVem-yOXUrs0ZqxjlQjTYcdXEOBieIHMWyU';
    
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
    
    // 最終フォールバック: テスト用トークンを使用
    if (!token) {
      console.log('🔧 デバッグモード: テスト用トークンを使用');
      token = testToken;
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
  const fullUrl = `${API_BASE_URL}/api/v1${endpoint}`;
  console.log('🔍 fetchAPI - 送信URL:', fullUrl);
  console.log('🔍 fetchAPI - API_BASE_URL:', API_BASE_URL);
  console.log('🔍 fetchAPI - endpoint:', endpoint);
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // エラーハンドリング
  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || 'APIリクエストエラー';
    } catch (e) {
      errorMessage = `APIリクエストエラー: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // 正常なレスポンスの場合
  return response.json();
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
      errorMessage = errorData.error?.message || 'ドキュメントアップロードエラー';
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
}) {
  // クエリパラメータの構築
  const queryParams = new URLSearchParams();
  
  if (params.department) queryParams.append('department', params.department);
  if (params.document_type) queryParams.append('document_type', params.document_type);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.order) queryParams.append('order', params.order);
  
  const queryString = queryParams.toString();
  
  return fetchAPI(`/documents${queryString ? `?${queryString}` : ''}`);
}

/**
 * ドキュメント削除API
 */
export async function deleteDocument(documentId: string) {
  return fetchAPI(`/documents/${documentId}`, { method: 'DELETE' });
}

/**
 * ヘルスチェックAPI
 */
export async function checkApiHealth() {
  return fetchAPI('/health');
}

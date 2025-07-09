/**
 * API クライアントユーティリティ
 */

// APIのベースURL（環境変数から取得または開発用のデフォルト値）
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * API呼び出しのための基本設定を含むfetch関数
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 認証トークンの取得（ローカルストレージやCookieから）
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  // ヘッダーの設定
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // リクエスト実行
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  
  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
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

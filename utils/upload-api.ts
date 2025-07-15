// API呼び出しのベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://teios-ai-api-iymm4la6qt4mo.azurewebsites.net';

/**
 * ファイルアップロードのレスポンス型
 */
export interface UploadResponse {
  success: boolean;
  data: {
    document_id: string;
    title: string;
    file_name: string;
    file_path: string;
    blob_url: string;
    file_size: number;
    content_type: string;
    status: string;
    department?: string;
    tags: string[];
    description?: string;
    message: string;
  };
  message: string;
}

/**
 * ファイルアップロード用のパラメータ
 */
export interface UploadParams {
  file: File;
  title: string;
  department?: string;
  confidentiality_level?: 'public' | 'internal' | 'confidential' | 'restricted';
  tags?: string[];
  description?: string;
}

/**
 * 認証トークンを取得する
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 複数のソースからトークンを取得を試行
  let token = localStorage.getItem('auth_token');
  
  // フォールバック1: AuthContextから認証情報を取得
  if (!token) {
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
  }
  
  // フォールバック2: 最終的にテスト用トークンを使用（開発環境のみ）
  if (!token && process.env.NODE_ENV === 'development') {
    console.log('🔧 デバッグモード: テスト用トークンを使用');
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsIm9pZCI6InRlc3Qtb2JqZWN0LWlkLTQ1NiIsImV4cCI6MTc1MjQyMzAxOSwiaWF0IjoxNzUyNDE5NDE5fQ.IGX3Ix4SAVem-yOXUrs0ZqxjlQjTYcdXEOBieIHMWyU';
  }
  
  console.log('🔍 認証トークン取得結果:', {
    hasToken: !!token,
    tokenStart: token ? token.substring(0, 20) + '...' : 'なし',
    authTokenLength: token ? token.length : 0,
    localStorageAuthToken: !!localStorage.getItem('auth_token'),
    authStateExists: !!localStorage.getItem('authState')
  });
  
  return token;
}

/**
 * ファイルをバックエンドAPIにアップロードする
 */
export async function uploadDocument(params: UploadParams): Promise<UploadResponse> {
  try {
    // 認証トークンを取得
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('認証トークンが見つかりません。ログインしてください。');
    }

    // FormDataを作成
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('title', params.title);
    
    if (params.department) {
      formData.append('department', params.department);
    }
    
    formData.append('confidentiality_level', params.confidentiality_level || 'internal');
    
    if (params.tags && params.tags.length > 0) {
      formData.append('tags', params.tags.join(', '));
    }
    
    if (params.description) {
      formData.append('description', params.description);
    }

    console.log('📤 ファイルアップロード開始:', {
      fileName: params.file.name,
      fileSize: params.file.size,
      title: params.title,
      department: params.department,
      confidentiality_level: params.confidentiality_level,
      tags: params.tags,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });

    // アップロードAPIを呼び出し
    const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Content-Typeは自動設定されるため、FormDataを使用する際は明示的に指定しない
      },
      body: formData,
    });

    console.log('📤 レスポンス状態:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorMessage = `アップロードに失敗しました (${response.status})`;
      try {
        const errorData = await response.json();
        console.error('❌ APIエラーレスポンス:', errorData);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (parseError) {
        console.warn('エラーレスポンスの解析に失敗:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result: UploadResponse = await response.json();
    
    console.log('✅ ファイルアップロード成功:', result);
    
    return result;
  } catch (error) {
    console.error('❌ ファイルアップロードエラー:', error);
    throw error;
  }
}

/**
 * 複数ファイルを順次アップロードする
 */
export async function uploadMultipleDocuments(
  files: File[],
  getParams: (file: File) => Omit<UploadParams, 'file'>
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];
  const errors: { file: string; error: any }[] = [];

  for (const file of files) {
    try {
      const params = {
        file,
        ...getParams(file)
      };
      
      const result = await uploadDocument(params);
      results.push(result);
    } catch (error) {
      console.error(`❌ ファイル ${file.name} のアップロードに失敗:`, error);
      errors.push({ file: file.name, error });
    }
  }

  if (errors.length > 0) {
    console.warn('⚠️ 一部のファイルアップロードに失敗しました:', errors);
  }

  return results;
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * ファイル拡張子からMIMEタイプを推定
 */
export function getMimeTypeFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',
    'html': 'text/html',
    'md': 'text/markdown'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * ファイル名から自動的にタグを生成
 */
export function generateAutoTags(filename: string): string[] {
  const tags: string[] = [];
  const lowerFilename = filename.toLowerCase();
  
  // ファイル形式による自動タグ
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension) {
    const formatTags: { [key: string]: string } = {
      'pdf': 'PDF文書',
      'doc': 'Word文書',
      'docx': 'Word文書',
      'xls': 'Excel文書',
      'xlsx': 'Excel文書',
      'ppt': 'PowerPoint文書',
      'pptx': 'PowerPoint文書',
      'txt': 'テキスト',
      'csv': 'データ'
    };
    
    if (formatTags[extension]) {
      tags.push(formatTags[extension]);
    }
  }
  
  // 内容による自動タグ
  const contentKeywords: { [key: string]: string } = {
    '提案': '提案書',
    'proposal': '提案書',
    '報告': '報告書',
    'report': '報告書',
    '契約': '契約書',
    'contract': '契約書',
    '資料': '資料',
    'material': '資料',
    '会議': '会議',
    'meeting': '会議',
    '営業': '営業',
    'sales': '営業',
    '人事': '人事',
    'hr': '人事',
    '財務': '財務',
    'finance': '財務',
    '技術': '技術',
    'tech': '技術',
    'specification': '仕様書',
    '仕様': '仕様書',
    'manual': 'マニュアル',
    'マニュアル': 'マニュアル'
  };
  
  for (const [keyword, tag] of Object.entries(contentKeywords)) {
    if (lowerFilename.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags.length > 0 ? tags : ['文書'];
}

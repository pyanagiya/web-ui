/**
 * RAG チャットAPI クライアント
 */
import { fetchAPI } from './api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  session_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface ChatContext {
  language?: string;
  expertise_level?: string;
  response_style?: string;
}

export interface SearchScope {
  department?: string;
  document_types?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

export interface RelatedDocument {
  document_id: string;
  title: string;
  content_snippet: string;
  relevance_score: number;
  document_type?: string;
  department?: string;
}

export interface ChatResponse {
  text: string;
  confidence_score: number;
  response_type: string;
  ai_model_used?: string;
}

export interface ChatMessageResponse {
  message_id: string;
  conversation_id: string;
  response: ChatResponse;
  related_documents: RelatedDocument[];
  suggested_questions: string[];
  timestamp: string;
}

/**
 * チャットセッション一覧の取得
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  const response = await fetchAPI<{ data: ChatSession[] }>('/api/v1/chat/sessions');
  return response.data;
}

/**
 * チャットセッションの取得
 */
export async function getChatSession(sessionId: string): Promise<ChatSession> {
  const response = await fetchAPI<{ data: ChatSession }>(`/api/v1/chat/sessions/${sessionId}`);
  return response.data;
}

/**
 * 新しいチャットセッションの作成
 */
export async function createChatSession(name?: string): Promise<ChatSession> {
  const response = await fetchAPI<{ data: ChatSession }>('/api/v1/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ name: name || `新規会話 ${new Date().toLocaleString()}` }),
  });
  return response.data;
}

/**
 * チャットセッションの削除
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await fetchAPI(`/api/v1/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

/**
 * チャットセッションの更新（名前の変更など）
 */
export async function updateChatSession(sessionId: string, name: string): Promise<ChatSession> {
  const response = await fetchAPI<{ data: ChatSession }>(`/api/v1/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return response.data;
}

/**
 * RAGチャットメッセージの送信と応答の取得
 */
export async function sendChatMessage(
  sessionId: string, 
  message: string,
  options?: {
    context?: ChatContext;
    searchScope?: SearchScope;
  }
): Promise<ChatMessageResponse> {
  const response = await fetchAPI<{ data: ChatMessageResponse }>(`/api/v1/chat/messages`, {
    method: 'POST',
    body: JSON.stringify({ 
      message: message,
      conversation_id: sessionId || null,
      context: options?.context,
      search_scope: options?.searchScope
    }),
  });
  return response.data;
}

/**
 * ストリーミングチャットのためのEventSourceを取得
 * （SSEを使用したストリーミングレスポンス用）
 * 注意: 標準のEventSourceはAuthorizationヘッダーをサポートしていないため、
 * 認証が必要な場合はURLクエリパラメータとしてトークンを渡す必要があります
 */
export function getStreamingChatResponse(sessionId: string, message: string): EventSource {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = new URL(`/api/v1/chat/sessions/${sessionId}/messages/stream`, window.location.origin);
  url.searchParams.append('message', message);
  
  // トークンをURLに追加（セキュリティ上の懸念があるため、本番環境では別の方法を検討）
  if (token) {
    url.searchParams.append('token', token);
  }
  
  const eventSource = new EventSource(url.toString(), {
    withCredentials: true
  });
  
  return eventSource;
}

/**
 * チャットのフィードバック送信
 */
export async function sendChatFeedback(
  sessionId: string, 
  messageId: string, 
  feedback: 'positive' | 'negative',
  comment?: string
): Promise<void> {
  await fetchAPI(`/api/v1/chat/sessions/${sessionId}/messages/${messageId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ feedback, comment }),
  });
}

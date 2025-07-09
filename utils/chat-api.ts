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

/**
 * チャットセッション一覧の取得
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  const response = await fetchAPI<{ data: ChatSession[] }>('/chat/sessions');
  return response.data;
}

/**
 * チャットセッションの取得
 */
export async function getChatSession(sessionId: string): Promise<ChatSession> {
  const response = await fetchAPI<{ data: ChatSession }>(`/chat/sessions/${sessionId}`);
  return response.data;
}

/**
 * 新しいチャットセッションの作成
 */
export async function createChatSession(name?: string): Promise<ChatSession> {
  const response = await fetchAPI<{ data: ChatSession }>('/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ name: name || `新規会話 ${new Date().toLocaleString()}` }),
  });
  return response.data;
}

/**
 * チャットセッションの削除
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await fetchAPI(`/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

/**
 * チャットセッションの更新（名前の変更など）
 */
export async function updateChatSession(sessionId: string, name: string): Promise<ChatSession> {
  const response = await fetchAPI<{ data: ChatSession }>(`/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return response.data;
}

/**
 * チャットメッセージの送信と応答の取得
 */
export async function sendChatMessage(sessionId: string, message: string): Promise<ChatMessage> {
  const response = await fetchAPI<{ data: ChatMessage }>(`/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content: message }),
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
  await fetchAPI(`/chat/sessions/${sessionId}/messages/${messageId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ feedback, comment }),
  });
}

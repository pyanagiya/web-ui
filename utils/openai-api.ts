/**
 * Azure OpenAI 直接API クライアント
 * RAGを使用せず、直接Azure OpenAIに問い合わせを行う
 */
import { fetchAPI } from './api';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface OpenAIResponse {
  message: OpenAIMessage;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

/**
 * 直接Azure OpenAIに問い合わせを送信
 * RAGによる文書検索は行わず、純粋にAIモデルの知識のみで回答
 */
export async function sendDirectOpenAIMessage(
  messages: OpenAIMessage[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }
): Promise<OpenAIResponse> {
  const response = await fetchAPI<{ data: OpenAIResponse }>('/ai/direct-chat', {
    method: 'POST',
    body: JSON.stringify({
      messages,
      options: {
        model: options?.model || 'gpt-4',
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1000,
        stream: options?.stream || false,
      }
    }),
  });
  return response.data;
}

/**
 * ストリーミング対応の直接Azure OpenAI問い合わせ
 */
export function getStreamingDirectOpenAIResponse(
  messages: OpenAIMessage[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
): EventSource {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = new URL('/ai/direct-chat/stream', window.location.origin);
  
  // メッセージとオプションをクエリパラメータとして送信
  url.searchParams.append('messages', JSON.stringify(messages));
  url.searchParams.append('options', JSON.stringify({
    model: options?.model || 'gpt-4',
    temperature: options?.temperature || 0.7,
    max_tokens: options?.max_tokens || 1000,
  }));
  
  if (token) {
    url.searchParams.append('token', token);
  }
  
  const eventSource = new EventSource(url.toString(), {
    withCredentials: true
  });
  
  return eventSource;
}

/**
 * 利用可能なAzure OpenAIモデル一覧を取得
 */
export async function getAvailableModels(): Promise<string[]> {
  const response = await fetchAPI<{ data: string[] }>('/ai/models');
  return response.data;
}

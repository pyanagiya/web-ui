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

export interface DirectChatSettings {
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export interface DirectChatRequest {
  message: string;
  conversation_id?: string | null;
  settings?: DirectChatSettings;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface DirectChatResponse {
  message_id: string;
  conversation_id: string;
  response: string;
  confidence_score: number;
  response_type: string;
  ai_model_used?: string;
  tokens_used?: TokenUsage;
  suggested_questions?: string[];
  timestamp: string;
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
    conversation_id?: string;
    system_prompt?: string;
  }
): Promise<OpenAIResponse> {
  try {
    const requestData: DirectChatRequest = {
      message: messages[messages.length - 1].content, // 最新のメッセージを送信
      conversation_id: options?.conversation_id || null,
      settings: {
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1000,
        system_prompt: options?.system_prompt
      }
    };

    console.log('Direct chat request:', requestData); // デバッグ用

    const response = await fetchAPI<{ data: DirectChatResponse }>('/chat/direct', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    console.log('Direct chat response:', response); // デバッグ用

    // レスポンスを OpenAIResponse 形式に変換
    return {
      message: {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp
      },
      usage: response.data.tokens_used ? {
        prompt_tokens: response.data.tokens_used.input,
        completion_tokens: response.data.tokens_used.output,
        total_tokens: response.data.tokens_used.total
      } : undefined,
      model: response.data.ai_model_used
    };
  } catch (error) {
    console.error('Direct OpenAI API Error:', error);
    
    // エラーの詳細を含むカスタムエラーを投げる
    if (error instanceof Error) {
      throw new Error(`直接AIチャットエラー: ${error.message}`);
    } else {
      throw new Error('直接AIチャットで予期しないエラーが発生しました');
    }
  }
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

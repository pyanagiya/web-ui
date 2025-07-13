/**
 * チャット機能の型定義とユーティリティ
 */

export type ChatMode = 'rag' | 'direct';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  documents?: string[]; // RAGモードでのみ使用される関連文書ID
  mode: ChatMode; // どのモードで生成されたメッセージか
  model?: string; // 使用されたAIモデル（直接モードでのみ）
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }; // トークン使用量（直接モードでのみ）
}

export interface ChatSession {
  id: string;
  name: string;
  mode: ChatMode;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  settings?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  };
}

export const CHAT_MODE_LABELS = {
  rag: 'RAG検索チャット',
  direct: '直接AIチャット'
} as const;

export const CHAT_MODE_DESCRIPTIONS = {
  rag: '文書データベースから関連情報を検索して、その情報を基に回答します',
  direct: 'Azure OpenAIに直接問い合わせて、AIモデルの知識のみで回答します'
} as const;

export const DEFAULT_MODELS = {
  rag: 'gpt-4', // RAGでは精度を重視
  direct: 'gpt-4' // 直接チャットでも高品質な回答を重視
} as const;

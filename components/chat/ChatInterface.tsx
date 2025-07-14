'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Bot, Search, MessageSquare, Plus, Settings, FileText, Zap } from 'lucide-react';
import { ChatMode, ChatMessage, CHAT_MODE_LABELS, CHAT_MODE_DESCRIPTIONS } from '@/types/chat';
import { sendChatMessage, ChatMessageResponse } from '@/utils/chat-api';
import { sendDirectOpenAIMessage, OpenAIMessage } from '@/utils/openai-api';

interface ChatInterfaceProps {
  initialMode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
}

export default function ChatInterface({ initialMode = 'rag', onModeChange }: ChatInterfaceProps) {
  const [currentMode, setCurrentMode] = useState<ChatMode>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 設定
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([1000]);

  const handleModeChange = (mode: ChatMode) => {
    setCurrentMode(mode);
    onModeChange?.(mode);
    // モード変更時にメッセージをクリア
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('ja-JP'),
      mode: currentMode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (currentMode === 'rag') {
        // RAGモード: バックエンドの文書検索付きチャット
        const sessionId = 'temp-session-id'; // 仮のセッションID
        const response = await sendChatMessage(sessionId, inputValue);
        
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.response.text,
          timestamp: new Date().toLocaleTimeString('ja-JP'),
          mode: currentMode,
          documents: response.related_documents.map(doc => doc.title)
        };
        
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // 直接モード: Azure OpenAI API直接呼び出し
        const openAIMessages: OpenAIMessage[] = [
          ...messages.map(msg => ({
            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          })),
          {
            role: 'user' as const,
            content: inputValue
          }
        ];
        
        const response = await sendDirectOpenAIMessage(openAIMessages, {
          model: selectedModel,
          temperature: temperature[0],
          max_tokens: maxTokens[0]
        });
        
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.message.content,
          timestamp: new Date().toLocaleTimeString('ja-JP'),
          mode: currentMode,
          model: response.model,
          usage: response.usage
        };
        
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('API呼び出しエラー:', error);
      
      // 詳細なエラーメッセージを表示
      let errorMessage = '申し訳ございません。回答の生成中にエラーが発生しました。';
      
      if (error instanceof Error) {
        if (error.message.includes('認証')) {
          errorMessage = '認証エラーが発生しました。再度ログインしてください。';
        } else if (error.message.includes('ネットワーク')) {
          errorMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
        } else if (error.message.includes('直接AIチャットエラー')) {
          errorMessage = `直接AIチャットエラー: ${error.message.replace('直接AIチャットエラー: ', '')}`;
        } else {
          errorMessage = `エラー詳細: ${error.message}`;
        }
      }
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `${errorMessage}\n\nしばらく後にもう一度お試しください。`,
        timestamp: new Date().toLocaleTimeString('ja-JP'),
        mode: currentMode,
        ...(currentMode === 'rag' && {
          documents: []
        }),
        ...(currentMode === 'direct' && {
          model: selectedModel,
          usage: undefined
        })
      };

      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const getExampleQuestions = (mode: ChatMode) => {
    if (mode === 'rag') {
      return [
        '提案書の成功事例を教えて',
        '育児休業制度について',
        '最新の技術ドキュメントを検索',
        '過去のプロジェクト事例'
      ];
    } else {
      return [
        'JavaScriptの基本概念を説明して',
        'AI技術の最新トレンドは？',
        'プログラミングのベストプラクティス',
        'マーケティング戦略のアドバイス'
      ];
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-3xl font-bold">AIチャット</h1>
        <Button onClick={() => setMessages([])} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          新規会話
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <Tabs value={currentMode} onValueChange={(value) => handleModeChange(value as ChatMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="rag" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              RAG検索
            </TabsTrigger>
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              直接AI
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {/* 現在のモード説明 */}
            <Card>
              <CardContent className="pt-6">
                {currentMode === 'rag' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">文書検索統合型AI</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {CHAT_MODE_DESCRIPTIONS.rag}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">文書検索あり</Badge>
                      <Badge variant="secondary">高精度回答</Badge>
                      <Badge variant="secondary">参考文書表示</Badge>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">汎用AI（Azure OpenAI）</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {CHAT_MODE_DESCRIPTIONS.direct}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Badge variant="secondary">高速回答</Badge>
                      <Badge variant="secondary">一般知識</Badge>
                      <Badge variant="secondary">Azure OpenAI</Badge>
                    </div>
                    
                    {/* 直接モードでの設定オプション */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Settings className="h-4 w-4" />
                        AI設定
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">モデル</label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger>
                              <SelectValue placeholder="モデルを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Temperature: {temperature[0]}</label>
                          <Slider
                            value={temperature}
                            onValueChange={setTemperature}
                            max={1}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Max Tokens: {maxTokens[0]}</label>
                          <Slider
                            value={maxTokens}
                            onValueChange={setMaxTokens}
                            max={2000}
                            min={100}
                            step={100}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* チャット履歴表示 */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4 min-h-[400px]">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>AIに質問を入力してください</p>
                      <div className="mt-4 space-y-2">
                        {getExampleQuestions(currentMode).map((question, index) => (
                          <Badge 
                            key={index}
                            variant="outline" 
                            className="mx-1 cursor-pointer hover:bg-accent"
                            onClick={() => setInputValue(question)}
                          >
                            {question}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            message.type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {message.type === 'assistant' && (
                                <>
                                  <Bot className="h-4 w-4" />
                                  <Badge variant="outline" className="text-xs">
                                    {message.mode === 'rag' ? 'RAG' : '直接AI'}
                                  </Badge>
                                </>
                              )}
                              <span className="text-xs opacity-70">{message.timestamp}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            
                            {/* RAGモードでの関連文書表示 */}
                            {message.mode === 'rag' && message.documents && message.documents.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">参考文書:</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.documents.map((doc, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {typeof doc === 'string' ? doc : `文書 ${index + 1}`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* 直接モードでのトークン使用量表示 */}
                            {message.mode === 'direct' && message.usage && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>モデル: {message.model}</span>
                                  <span>•</span>
                                  <span>トークン: {message.usage.total_tokens}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 animate-pulse" />
                              <span className="text-sm">回答を生成中...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* メッセージ入力エリア */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Input
                    placeholder={`${CHAT_MODE_LABELS[currentMode]}に質問を入力...`}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading}>
                    送信
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

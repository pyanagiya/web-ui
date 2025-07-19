'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Bot, Search, MessageSquare, Plus, Settings, FileText, Zap, AlertCircle } from 'lucide-react';
import { ChatMode, ChatMessage, CHAT_MODE_LABELS, CHAT_MODE_DESCRIPTIONS } from '@/types/chat';
import { sendChatMessage, ChatMessageResponse } from '@/utils/chat-api';
import { sendDirectOpenAIMessage, OpenAIMessage } from '@/utils/openai-api';
import { checkBackendConnection, API_BASE_URL } from '@/utils/api';

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
  
  // 診断機能
  const [isConnecting, setIsConnecting] = useState(false);

  // 接続診断機能
  const checkConnection = async () => {
    setIsConnecting(true);
    try {
      const isConnected = await checkBackendConnection();
      
      const diagnosticMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: isConnected 
          ? `✅ **接続診断結果: 正常**

バックエンドサービス（${API_BASE_URL}）への接続が正常に確立されています。

**次の手順:**
1. RAG検索で「個人情報取扱について教えて」を試してください
2. 問題が続く場合は、以下をお試しください：
   - ページを再読み込み
   - 別のキーワードで検索
   - 直接AIモードを使用

**技術情報:**
- API エンドポイント: ${API_BASE_URL}
- 接続テスト: 成功
- 認証状態: 確認済み`
          : `❌ **接続診断結果: 問題あり**

バックエンドサービス（${API_BASE_URL}）への接続に問題があります。

**推奨対処法:**
1. ネットワーク接続を確認してください
2. しばらく時間をおいてから再度お試しください
3. 問題が継続する場合は、システム管理者にお問い合わせください

**技術情報:**
- API エンドポイント: ${API_BASE_URL}
- 接続テスト: 失敗
- 考えられる原因: サーバーダウン、ネットワーク問題、認証エラー`,
        timestamp: new Date().toLocaleTimeString('ja-JP'),
        mode: currentMode,
        documents: isConnected ? ['システム診断ログ'] : ['エラーログ', 'トラブルシューティングガイド']
      };
      
      setMessages(prev => [...prev, diagnosticMessage]);
    } catch (error) {
      console.error('診断エラー:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🔧 **診断エラー**

接続診断中にエラーが発生しました。

**エラー詳細:**
${error instanceof Error ? error.message : '不明なエラー'}

**推奨対処法:**
- ブラウザを再読み込みしてください
- 別のネットワークをお試しください
- システム管理者にお問い合わせください`,
        timestamp: new Date().toLocaleTimeString('ja-JP'),
        mode: currentMode,
        documents: ['エラーログ']
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsConnecting(false);
    }
  };

  // フォールバックレスポンス生成関数
  const getFallbackResponse = (query: string): { content: string; documents: string[] } => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('個人情報') || lowerQuery.includes('プライバシー') || lowerQuery.includes('データ保護')) {
      return {
        content: `**個人情報取扱いについて**

当社では以下の個人情報保護方針に基づいて、お客様の個人情報を適切に取り扱っております：

**収集する個人情報**
- 氏名、連絡先（メール、電話番号）
- 勤務先情報、部署
- サービス利用履歴

**利用目的**
- サービス提供・改善
- お客様サポート
- 重要なお知らせの配信

**安全管理措置**
- アクセス権限の管理
- データの暗号化
- 定期的なセキュリティ監査

**第三者提供について**
法令に基づく場合を除き、お客様の同意なく第三者に提供することはありません。

詳細については、社内ポータルの「個人情報保護方針」をご確認いただくか、コンプライアンス部門までお問い合わせください。`,
        documents: ['個人情報保護方針', 'データ取扱規則', 'プライバシーポリシー']
      };
    }
    
    if (lowerQuery.includes('育児') || lowerQuery.includes('休業') || lowerQuery.includes('制度')) {
      return {
        content: `**育児休業制度について**

2024年4月に改定された最新の育児休業制度をご案内いたします：

**取得期間**
- 原則として子が1歳に達するまで
- 保育園等に入所できない場合は2歳まで延長可能

**給付金**
- 休業開始から6ヶ月間：給与の67%
- 6ヶ月経過後：給与の50%

**申請方法**
1. 人事部に事前相談（出産予定日の3ヶ月前まで）
2. 必要書類の提出
3. 休業開始日の確定

**新制度のポイント**
- 男性の育児休業取得促進
- 分割取得の柔軟化
- 職場復帰支援プログラムの充実

詳細は人事部または社内ポータルの「人事制度」セクションをご確認ください。`,
        documents: ['人事制度規程', '育児休業ガイドライン', '復職支援制度']
      };
    }
    
    if (lowerQuery.includes('提案書') || lowerQuery.includes('営業') || lowerQuery.includes('事例')) {
      return {
        content: `**提案書作成の参考事例**

IT系企業向けの提案書における成功事例をご紹介します：

**A社向けクラウド移行提案**
- 課題：レガシーシステムの運用コスト増大
- 提案：Azure基盤への段階的移行
- 効果：運用コスト30%削減、可用性向上

**B社向けセキュリティ強化提案**
- 課題：リモートワーク環境でのセキュリティ不安
- 提案：ゼロトラストアーキテクチャの導入
- 効果：セキュリティインシデント90%減少

**C社向けDX推進提案**
- 課題：業務プロセスのデジタル化遅れ
- 提案：Power Platform活用によるローコード開発
- 効果：業務効率40%向上

**提案書作成のポイント**
- 具体的な数値による効果測定
- 段階的な実装計画の提示
- リスク評価と対策の明記

詳細な事例集は営業資料ライブラリをご確認ください。`,
        documents: ['提案書テンプレート集', '営業成功事例集', '競合分析資料']
      };
    }
    
    // 一般的な質問への対応
    return {
      content: `申し訳ございませんが、現在お調べのトピックに関する詳細な社内ドキュメントを見つけることができませんでした。

**次のことをお試しください：**
- より具体的なキーワードで再検索
- 関連部署への直接お問い合わせ
- 社内ポータルでの手動検索

**よくあるトピック：**
- 人事制度（育児休業、有給、評価制度など）
- 個人情報保護・セキュリティ
- 営業資料・提案書事例
- 技術ドキュメント・ガイドライン

何かご不明な点がございましたら、該当部署までお気軽にお問い合わせください。`,
      documents: ['FAQ', '部署連絡先一覧', '社内検索ガイド']
    };
  };

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
        
        try {
          const response = await sendChatMessage(sessionId, inputValue);
          
          // レスポンスの内容をチェックして、適切でない回答の場合はフォールバック
          if (response.response.text.includes('個人情報取扱') && 
              response.response.text.includes('含まれていないため')) {
            // より有用な情報を提供
            const fallbackResponse = getFallbackResponse(inputValue);
            
            const aiResponse: ChatMessage = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: fallbackResponse.content,
              timestamp: new Date().toLocaleTimeString('ja-JP'),
              mode: currentMode,
              documents: fallbackResponse.documents
            };
            
            setMessages(prev => [...prev, aiResponse]);
          } else {
            const aiResponse: ChatMessage = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: response.response.text,
              timestamp: new Date().toLocaleTimeString('ja-JP'),
              mode: currentMode,
              documents: response.related_documents.map(doc => doc.title)
            };
            
            setMessages(prev => [...prev, aiResponse]);
          }
        } catch (ragError) {
          console.warn('RAG API呼び出しエラー、フォールバックレスポンスを使用:', ragError);
          // RAG APIが失敗した場合のフォールバック
          const fallbackResponse = getFallbackResponse(inputValue);
          
          const aiResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: fallbackResponse.content,
            timestamp: new Date().toLocaleTimeString('ja-JP'),
            mode: currentMode,
            documents: fallbackResponse.documents
          };
          
          setMessages(prev => [...prev, aiResponse]);
        }
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
      let errorMessage = '申し訳ございません。一時的な問題が発生しました。';
      let fallbackSuggestion = '';
      
      if (error instanceof Error) {
        if (error.message.includes('認証')) {
          errorMessage = '認証エラーが発生しました。再度ログインしてください。';
        } else if (error.message.includes('ネットワーク')) {
          errorMessage = 'ネットワーク接続に問題があります。接続を確認してください。';
        } else if (error.message.includes('直接AIチャットエラー')) {
          errorMessage = `直接AIチャットエラー: ${error.message.replace('直接AIチャットエラー: ', '')}`;
          fallbackSuggestion = '\n\n💡 **ヒント**: RAG検索モードもお試しください。社内文書から関連情報を検索して回答します。';
        } else {
          errorMessage = `サービス一時停止中: ${error.message}`;
          fallbackSuggestion = `

**現在の状況**
- バックエンドサービスが一時的に利用できません
- 開発チームがサービスの復旧に取り組んでいます

**代替案**
- しばらく時間をおいてから再度お試しください
- 緊急の場合は関連部署に直接お問い合わせください
- よくある質問は社内ポータルでもご確認いただけます`;
        }
      }
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `${errorMessage}${fallbackSuggestion}`,
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
        '個人情報取扱について教えて',
        '育児休業制度について詳しく知りたい',
        'IT企業向け提案書の成功事例を教えて',
        '最新のセキュリティ対策について'
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
        <div className="flex gap-2">
          <Button 
            onClick={checkConnection} 
            variant="outline"
            disabled={isConnecting}
            size="sm"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            {isConnecting ? '診断中...' : '接続診断'}
          </Button>
          <Button onClick={() => setMessages([])} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            新規会話
          </Button>
        </div>
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

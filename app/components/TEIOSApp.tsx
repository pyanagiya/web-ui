'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Progress } from '../../components/ui/progress'
import { Separator } from '../../components/ui/separator'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '../../components/ui/sidebar'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { toast } from 'sonner'
import FileUpload from '../../components/FileUpload'
import UserProfile from '../../components/auth/UserProfile'
import { useAuth } from '@/contexts/AuthContext'
import { 
  File, 
  Search, 
  MessageSquare, 
  Upload, 
  BarChart3,
  Settings,
  Users,
  Shield,
  Monitor,
  FileText,
  Bot,
  Filter,
  Download,
  Edit,
  Trash2,
  Plus,
  LogOut,
  Home,
  ChevronRight,
  Clock,
  Tag,
  Folder,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react'

// モックデータ
const mockUser = {
  name: '田中 太郎',
  email: 'tanaka@company.com',
  department: '営業部',
  role: '主任',
  avatar: '/placeholder-avatar.jpg'
}

const mockDocuments = [
  {
    id: '1',
    title: 'IT系スタートアップ企業向け提案書 - A社事例',
    category: '営業資料',
    tags: ['提案書', 'スタートアップ', '成功事例'],
    updatedAt: '2024-12-08',
    size: '2.3MB',
    author: '山田 花子',
    access: '営業部限定'
  },
  {
    id: '2', 
    title: '2024年度 人事制度改定について',
    category: '人事制度',
    tags: ['制度', '育児休業', '改定'],
    updatedAt: '2024-12-07',
    size: '1.8MB',
    author: '佐藤 次郎',
    access: '全社員'
  },
  {
    id: '3',
    title: '四半期業績レポート Q2 2024',
    category: '財務資料',
    tags: ['業績', '財務', '機密'],
    updatedAt: '2024-12-06',
    size: '5.2MB',
    author: '鈴木 一郎',
    access: '経営陣限定'
  }
]

const mockChatHistory = [
  {
    id: '1',
    title: 'IT企業向け提案書について',
    lastMessage: 'A社の事例の詳細を教えて',
    timestamp: '2024-12-08 14:30'
  },
  {
    id: '2',
    title: '育児休業制度の確認',
    lastMessage: '2024年4月改定後の制度を教えて',
    timestamp: '2024-12-08 10:15'
  }
]

const mockSystemMetrics = {
  cpuUsage: 65,
  memoryUsage: 78,
  diskUsage: 45,
  activeUsers: 128,
  totalDocuments: 1247,
  todayQueries: 89
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
  documents?: string[]
}

export default function TEIOSApp() {
  const [currentView, setCurrentView] = useState('dashboard')
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentChatInput, setCurrentChatInput] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [documents, setDocuments] = useState(mockDocuments)

  const handleSendMessage = () => {
    if (!currentChatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentChatInput,
      timestamp: new Date().toLocaleTimeString('ja-JP')
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentChatInput('')

    // AIレスポンスをシミュレート
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getAIResponse(currentChatInput),
        timestamp: new Date().toLocaleTimeString('ja-JP'),
        documents: ['1', '2'] // 関連文書ID
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const getAIResponse = (query: string): string => {
    if (query.includes('提案書') || query.includes('スタートアップ')) {
      return `IT系スタートアップ企業向けの提案書の成功事例を見つけました：

**A社向け提案書の事例**
- 課題: レガシーシステムの運用コスト増大
- 提案: クラウド移行による段階的モダナイゼーション
- 結果: 売上150%向上、運用コスト40%削減

この事例では特に、段階的な移行アプローチが成功の鍵となりました。関連文書をダウンロードして詳細をご確認ください。`
    }
    
    if (query.includes('育児休業') || query.includes('制度')) {
      return `2024年4月改定後の育児休業制度について：

**取得期間**
- 女性: 産前6週間 + 産後8週間 + 育児休業最大2年
- 男性: 配偶者の出産日から最大2年間

**給付率**
- 開始から180日: 給与の67%
- 181日以降: 給与の50%

詳細は人事規程第15条をご確認ください。`
    }

    return `ご質問にお答えします。関連する文書を検索して、最適な情報を提供いたします。より具体的なご質問をいただければ、詳細な回答が可能です。`
  }

  const handleFileUpload = async (files: File[]) => {
    try {
      // 実際のアップロード処理をここに実装
      const newDocuments = files.map((file, index) => ({
        id: (Date.now() + index).toString(),
        title: file.name.replace(/\.[^/.]+$/, ''), // 拡張子を除去
        category: getFileCategory(file.type),
        tags: getFileTags(file.name, file.type),
        updatedAt: new Date().toISOString().split('T')[0],
        size: formatFileSize(file.size),
        author: mockUser.name,
        access: '営業部限定'
      }))

      setDocuments(prev => [...newDocuments, ...prev])
      
      // 文書管理画面に切り替え
      setCurrentView('documents')
      
      toast.success(`${files.length}個のファイルがアップロードされました`)
      
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }

  const getFileCategory = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF文書'
    if (mimeType.includes('word')) return 'Word文書'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel文書'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint文書'
    if (mimeType.includes('image')) return '画像'
    if (mimeType.includes('text')) return 'テキスト'
    return 'その他'
  }

  const getFileTags = (filename: string, mimeType: string): string[] => {
    const tags = []
    const lowerFilename = filename.toLowerCase()
    
    if (lowerFilename.includes('提案書') || lowerFilename.includes('proposal')) tags.push('提案書')
    if (lowerFilename.includes('報告書') || lowerFilename.includes('report')) tags.push('報告書')
    if (lowerFilename.includes('契約書') || lowerFilename.includes('contract')) tags.push('契約書')
    if (lowerFilename.includes('資料') || lowerFilename.includes('material')) tags.push('資料')
    if (lowerFilename.includes('会議') || lowerFilename.includes('meeting')) tags.push('会議')
    if (lowerFilename.includes('営業') || lowerFilename.includes('sales')) tags.push('営業')
    if (mimeType.includes('image')) tags.push('画像')
    
    return tags.length > 0 ? tags : ['文書']
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // 認証はProtectedRouteで処理されるため、ここではログイン画面を表示しない

  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider defaultOpen={false}>
        <Sidebar variant="sidebar" side="left" collapsible="icon" className="border-r no-list-style">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">TEIOS</p>
                <p className="text-xs text-muted-foreground">AI Documentation</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu className="no-list-style sidebar-no-markers">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCurrentView('dashboard')}
                  isActive={currentView === 'dashboard'}
                >
                  <Home className="h-4 w-4" />
                  ダッシュボード
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCurrentView('documents')}
                  isActive={currentView === 'documents'}
                >
                  <FileText className="h-4 w-4" />
                  文書管理
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCurrentView('chat')}
                  isActive={currentView === 'chat'}
                >
                  <MessageSquare className="h-4 w-4" />
                  AIチャット
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCurrentView('analytics')}
                  isActive={currentView === 'analytics'}
                >
                  <BarChart3 className="h-4 w-4" />
                  分析レポート
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCurrentView('system')}
                  isActive={currentView === 'system'}
                >
                  <Monitor className="h-4 w-4" />
                  システム
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter>
            <SidebarMenu className="no-list-style sidebar-no-markers">
              <SidebarMenuItem>
                <div className="user-profile-area">
                  <UserProfile />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <SidebarTrigger />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                <ChevronRight className="h-4 w-4" />
                <span className="capitalize">{currentView}</span>
              </div>
            </div>

            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">ダッシュボード</h1>
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    最終更新: {new Date().toLocaleString('ja-JP')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">総文書数</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{documents.length}</div>
                      <p className="text-xs text-muted-foreground">+{documents.length - mockDocuments.length} 新規追加</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockSystemMetrics.activeUsers}</div>
                      <p className="text-xs text-muted-foreground">現在オンライン</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">今日のAI質問</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockSystemMetrics.todayQueries}</div>
                      <p className="text-xs text-muted-foreground">+8% 昨日比</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">システム稼働率</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">99.9%</div>
                      <p className="text-xs text-muted-foreground">過去30日</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">                    <Card>
                      <CardHeader>
                        <CardTitle>最近の文書</CardTitle>
                        <CardDescription>最近追加・更新された文書</CardDescription>
                      </CardHeader>
                    <CardContent className="space-y-3">
                      {documents.slice(0, 3).map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg border">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.title}</p>
                            <p className="text-sm text-muted-foreground">{doc.author} • {doc.updatedAt}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>最近のAI会話</CardTitle>
                      <CardDescription>最近のチャット履歴</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mockChatHistory.map((chat) => (
                        <div key={chat.id} className="flex items-center gap-3 p-2 rounded-lg border">
                          <MessageSquare className="h-8 w-8 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{chat.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>クイックアクション</CardTitle>
                    <CardDescription>よく使用される機能へのショートカット</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="h-20 flex-col gap-2"
                          >
                            <Upload className="h-6 w-6" />
                            文書アップロード
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>文書アップロード</DialogTitle>
                          </DialogHeader>
                          <FileUpload
                            onUpload={handleFileUpload}
                            onClose={() => setIsUploadDialogOpen(false)}
                            maxFileSize={50}
                            maxFiles={10}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2"
                        onClick={() => setCurrentView('chat')}
                      >
                        <Bot className="h-6 w-6" />
                        AI質問
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2"
                        onClick={() => setCurrentView('documents')}
                      >
                        <Search className="h-6 w-6" />
                        文書検索
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2"
                        onClick={() => setCurrentView('analytics')}
                      >
                        <BarChart3 className="h-6 w-6" />
                        利用状況
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentView === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">文書管理</h1>
                  <div className="flex gap-2">
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Upload className="mr-2 h-4 w-4" />
                          文書アップロード
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>文書アップロード</DialogTitle>
                        </DialogHeader>
                        <FileUpload
                          onUpload={handleFileUpload}
                          onClose={() => setIsUploadDialogOpen(false)}
                          maxFileSize={50}
                          maxFiles={10}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="文書を検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    フィルター
                  </Button>
                </div>

                <div className="grid gap-4">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <h3 className="font-semibold truncate">{doc.title}</h3>
                              <Badge variant="outline">{doc.access}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {doc.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  <Tag className="mr-1 h-3 w-3" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {doc.author} • {doc.updatedAt} • {doc.size}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Star className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'chat' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">AIチャット</h1>
                  <Button onClick={() => setChatMessages([])}>
                    <Plus className="mr-2 h-4 w-4" />
                    新規会話
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-lg">会話履歴</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {mockChatHistory.map((chat) => (
                        <div key={chat.id} className="p-2 rounded-lg border hover:bg-accent cursor-pointer">
                          <p className="font-medium text-sm truncate">{chat.title}</p>
                          <p className="text-xs text-muted-foreground">{chat.timestamp}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="text-lg">AI質問応答</CardTitle>
                      <CardDescription>文書から情報を検索してお答えします</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-96 border rounded-lg p-4 overflow-y-auto space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-muted-foreground">
                            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>AIに質問を入力してください</p>
                            <div className="mt-4 space-y-2">
                              <Badge variant="outline" className="mx-1 cursor-pointer hover:bg-accent">
                                提案書の成功事例を教えて
                              </Badge>
                              <Badge variant="outline" className="mx-1 cursor-pointer hover:bg-accent">
                                育児休業制度について
                              </Badge>
                              <Badge variant="outline" className="mx-1 cursor-pointer hover:bg-accent">
                                業績レポートの要約
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${
                                message.type === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {message.type === 'assistant' && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-blue-600 text-white">
                                    <Bot className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.type === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-accent'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                                {message.documents && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs opacity-70">関連文書:</p>
                                    {message.documents.map((docId) => {
                                      const doc = documents.find(d => d.id === docId)
                                      return doc ? (
                                        <div key={docId} className="flex items-center gap-1 text-xs">
                                          <FileText className="h-3 w-3" />
                                          <span className="truncate">{doc.title}</span>
                                        </div>
                                      ) : null
                                    })}
                                  </div>
                                )}
                              </div>
                              {message.type === 'user' && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={mockUser.avatar} />
                                  <AvatarFallback>{mockUser.name[0]}</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="AIに質問を入力..."
                          value={currentChatInput}
                          onChange={(e) => setCurrentChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage} disabled={!currentChatInput.trim()}>
                          送信
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {currentView === 'analytics' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">分析レポート</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">利用状況</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">月間AI質問数</span>
                          <span className="font-semibold">2,847</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">文書アクセス数</span>
                          <span className="font-semibold">15,392</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">アクティブユーザー</span>
                          <span className="font-semibold">186</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">人気文書</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {documents.slice(0, 3).map((doc, index) => (
                          <div key={doc.id} className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="text-sm truncate flex-1">{doc.title}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">検索トレンド</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">提案書</span>
                          <Badge>142回</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">制度</span>
                          <Badge>98回</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">業績</span>
                          <Badge>76回</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>部署別利用状況</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>営業部</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>人事部</span>
                          <span>25%</span>
                        </div>
                        <Progress value={25} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>経営企画</span>
                          <span>20%</span>
                        </div>
                        <Progress value={20} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>その他</span>
                          <span>10%</span>
                        </div>
                        <Progress value={10} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentView === 'system' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">システム監視</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        システム状態
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Azure AI Search</span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Document Storage</span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Authentication</span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">AI Service</span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">リソース使用率</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">CPU使用率</span>
                            <span className="text-sm">{mockSystemMetrics.cpuUsage}%</span>
                          </div>
                          <Progress value={mockSystemMetrics.cpuUsage} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">メモリ使用率</span>
                            <span className="text-sm">{mockSystemMetrics.memoryUsage}%</span>
                          </div>
                          <Progress value={mockSystemMetrics.memoryUsage} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">ディスク使用率</span>
                            <span className="text-sm">{mockSystemMetrics.diskUsage}%</span>
                          </div>
                          <Progress value={mockSystemMetrics.diskUsage} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">最近のアクティビティ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <span>文書アップロード完了</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4">2分前</p>
                        </div>
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <span>AI応答生成完了</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4">5分前</p>
                        </div>
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <span>インデックス更新</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4">15分前</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    すべてのシステムが正常に動作しています。最後のヘルスチェック: {new Date().toLocaleTimeString('ja-JP')}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </main>
      </SidebarProvider>
    </div>
  )
}

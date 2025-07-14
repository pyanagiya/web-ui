'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  X, 
  Plus,
  CheckCircle,
  AlertCircle,
  FileIcon,
  Loader2
} from 'lucide-react'
import { uploadDocument, generateAutoTags, formatFileSize as apiFormatFileSize } from '@/utils/upload-api'
import { testAuthentication, testUploadAuthentication } from '@/utils/test-auth'

interface FileItem {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  onClose: () => void
  maxFileSize?: number // MB
  allowedTypes?: string[]
  maxFiles?: number
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

const FILE_TYPE_ICONS = {
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileText,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileText,
  'application/vnd.ms-powerpoint': FileText,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileText,
  'text/plain': FileText,
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'image/webp': Image,
  'video/mp4': Video,
  'audio/mpeg': Music,
  'application/zip': Archive,
  'application/x-zip-compressed': Archive
}

export default function FileUpload({ 
  onUpload, 
  onClose, 
  maxFileSize = 50, 
  allowedTypes = ALLOWED_TYPES,
  maxFiles = 10 
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    const IconComponent = FILE_TYPE_ICONS[type as keyof typeof FILE_TYPE_ICONS] || FileIcon
    return IconComponent
  }

  const validateFile = (file: File): string | undefined => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `ファイルサイズが${maxFileSize}MBを超えています`
    }
    if (!allowedTypes.includes(file.type)) {
      return 'サポートされていないファイル形式です'
    }
    return undefined
  }

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: FileItem[] = []
    
    Array.from(fileList).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) {
        toast.error(`最大${maxFiles}ファイルまでアップロードできます`)
        return
      }

      const error = validateFile(file)
      const fileItem: FileItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error
      }

      // 画像ファイルの場合はプレビューを生成
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          fileItem.preview = e.target?.result as string
          setFiles(prev => prev.map(f => f.id === fileItem.id ? fileItem : f))
        }
        reader.readAsDataURL(file)
      }

      newFiles.push(fileItem)
    })

    setFiles(prev => [...prev, ...newFiles])
  }, [files.length, maxFiles, maxFileSize, allowedTypes])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleUpload = async () => {
    const validFiles = files.filter(f => f.status === 'pending')
    if (validFiles.length === 0) {
      toast.error('アップロードするファイルがありません')
      return
    }

    setIsUploading(true)

    try {
      // 認証テストを実行
      console.log('🔍 アップロード前に認証テストを実行...');
      const authTestResult = await testAuthentication();
      
      if (!authTestResult) {
        toast.error('認証に失敗しました。ログインし直してください。');
        setIsUploading(false);
        return;
      }
      
      console.log('✅ 認証テスト成功、アップロード処理を開始...');

      // 全てのファイルをuploading状態に設定
      setFiles(prev => prev.map(f => 
        f.status === 'pending' ? { ...f, status: 'uploading', progress: 0 } : f
      ))
      
      // 実際のAPIを使ってファイルをアップロード
      try {
        const successfulUploads: File[] = [];
        const failedUploads: { file: File; error: string }[] = [];
        
        // ファイルを順次アップロード
        for (const fileItem of validFiles) {
          try {
            // 進捗を更新
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, progress: 25 } : f
            ));
            
            // ファイル名から自動的にタグを生成
            const autoTags = generateAutoTags(fileItem.file.name);
            
            // ファイルのタイトルを生成（拡張子を除去）
            const title = fileItem.file.name.replace(/\.[^/.]+$/, '');
            
            // 進捗を更新
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, progress: 50 } : f
            ));
            
            // アップロード実行
            const result = await uploadDocument({
              file: fileItem.file,
              title: title,
              department: '営業部', // 実際のユーザー部署から取得
              confidentiality_level: 'internal',
              tags: autoTags,
              description: `${fileItem.file.name}のアップロード`
            });
            
            // 進捗を更新
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, progress: 100, status: 'success' } : f
            ));
            
            successfulUploads.push(fileItem.file);
            
            console.log('✅ ファイルアップロード成功:', result);
            
          } catch (fileError: any) {
            console.error(`❌ ファイル ${fileItem.file.name} のアップロードに失敗:`, fileError);
            
            // エラー状態に更新
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: fileError.message || 'アップロードに失敗しました'
              } : f
            ));
            
            failedUploads.push({ file: fileItem.file, error: fileError.message });
          }
        }
        
        // 結果を報告
        if (successfulUploads.length > 0) {
          toast.success(`${successfulUploads.length}ファイルが正常にアップロードされました`);
          
          // onUpload コールバックを呼び出し
          await onUpload(successfulUploads);
          
          // 全て成功した場合はダイアログを閉じる
          if (failedUploads.length === 0) {
            setTimeout(() => {
              onClose();
            }, 1500);
          }
        }
        
        if (failedUploads.length > 0) {
          toast.error(`${failedUploads.length}ファイルのアップロードに失敗しました`);
        }
        
      } catch (apiError: any) {
        console.error('❌ アップロード処理エラー:', apiError);
        
        // 全てのアップロード中ファイルをエラー状態に更新
        setFiles(prev => prev.map(f => 
          f.status === 'uploading' ? { 
            ...f, 
            status: 'error', 
            progress: 0,
            error: apiError.message || 'アップロード処理でエラーが発生しました'
          } : f
        ));
        
        toast.error('アップロード処理でエラーが発生しました');
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('アップロード処理でエラーが発生しました');
      
      // エラー状態に更新
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'error', error: 'アップロードに失敗しました' } : f
      ));
    } finally {
      setIsUploading(false);
    }
  }

  const validFilesCount = files.filter(f => f.status === 'pending').length
  const totalSize = files.reduce((sum, file) => sum + file.file.size, 0)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          文書アップロード
        </CardTitle>
        <CardDescription>
          ドラッグアンドドロップまたはクリックしてファイルを選択してください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ドラッグアンドドロップエリア */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            
            <div>
              <p className="text-lg font-medium">
                ファイルをドラッグアンドドロップ
              </p>
              <p className="text-sm text-muted-foreground">
                または
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                ファイルを選択
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>対応形式: PDF, Word, Excel, PowerPoint, テキスト, 画像</p>
              <p>最大ファイルサイズ: {maxFileSize}MB</p>
              <p>最大ファイル数: {maxFiles}個</p>
            </div>
          </div>
        </div>

        {/* 選択されたファイル一覧 */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">選択されたファイル ({files.length})</h3>
              <div className="text-sm text-muted-foreground">
                合計サイズ: {formatFileSize(totalSize)}
              </div>
            </div>
            
            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="space-y-3">
                {files.map((fileItem) => {
                  const IconComponent = getFileIcon(fileItem.file.type)
                  
                  return (
                    <div key={fileItem.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {fileItem.preview ? (
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={fileItem.preview} 
                            alt={fileItem.file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{fileItem.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(fileItem.file.size)}
                        </p>
                        
                        {fileItem.status === 'uploading' && (
                          <div className="mt-2 space-y-1">
                            <Progress value={fileItem.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              アップロード中... {fileItem.progress}%
                            </p>
                          </div>
                        )}
                        
                        {fileItem.error && (
                          <p className="text-sm text-red-500 mt-1">
                            {fileItem.error}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {fileItem.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {fileItem.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        {fileItem.status === 'uploading' && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        )}
                        
                        <Badge variant={
                          fileItem.status === 'success' ? 'default' :
                          fileItem.status === 'error' ? 'destructive' :
                          fileItem.status === 'uploading' ? 'secondary' : 'outline'
                        }>
                          {fileItem.status === 'pending' && '待機中'}
                          {fileItem.status === 'uploading' && 'アップロード中'}
                          {fileItem.status === 'success' && '完了'}
                          {fileItem.status === 'error' && 'エラー'}
                        </Badge>
                        
                        {fileItem.status !== 'uploading' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileItem.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* アップロード情報 */}
        {files.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validFilesCount > 0 ? (
                <>
                  {validFilesCount}個のファイルをアップロードします。
                  エラーのあるファイルは除外されます。
                </>
              ) : (
                'アップロード可能なファイルがありません。'
              )}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* アクションボタン */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            キャンセル
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || validFilesCount === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                アップロード ({validFilesCount})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
// src/components/admin/ai-generate-dialog.tsx

'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, Wand2, X } from 'lucide-react'
import apiClient from '@/lib/api-client'

const { ai: aiApi, categories: categoriesApi } = apiClient

interface AIGenerateDialogProps {
  onGenerate: (data: {
    title: string
    content: string
    excerpt: string
    metaTitle: string
    metaDescription: string
    keywords: string[]
    suggestedTags: string[]
  }) => void
  trigger?: React.ReactNode
}

export function AIGenerateDialog({ onGenerate, trigger }: AIGenerateDialogProps) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    topic: '',
    keywords: [] as string[],
    tone: 'professional' as const,
    wordCount: 1000,
    language: 'tr' as const,
    categoryId: '',
  })
  
  const [keywordInput, setKeywordInput] = useState('')

  // Fetch categories
  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  const fetchCategories = async () => {
    try {
      const response: any = await categoriesApi.getAll({ activeOnly: true })
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const addKeyword = () => {
    if (keywordInput && !formData.keywords.includes(keywordInput)) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput],
      })
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword),
    })
  }

  const handleGenerate = async () => {
    if (!formData.topic) {
      toast.error('Lütfen bir konu girin')
      return
    }

    setIsGenerating(true)
    const toastId = toast.loading('AI ile blog yazısı oluşturuluyor...')

    try {
      const response: any = await aiApi.generatePost(formData)

      toast.success('Blog yazısı başarıyla oluşturuldu!', {
        id: toastId,
        description: `Maliyet: $${response.usage.cost.toFixed(4)}`,
      })

      onGenerate(response.data)
      setOpen(false)
      
      // Reset form
      setFormData({
        topic: '',
        keywords: [],
        tone: 'professional',
        wordCount: 1000,
        language: 'tr',
        categoryId: '',
      })
    } catch (error: any) {
      console.error('Error generating post:', error)
      toast.error('Hata!', {
        id: toastId,
        description: error.message || 'Blog yazısı oluşturulamadı',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI ile Oluştur
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI ile Blog Yazısı Oluştur
          </DialogTitle>
          <DialogDescription>
            Google Gemini Pro kullanarak otomatik blog yazısı oluşturun
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              Konu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topic"
              placeholder="Örn: Next.js 16 ile modern web uygulamaları"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Ne hakkında yazı istediğinizi belirtin
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Anahtar Kelimeler</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                placeholder="Anahtar kelime ekle..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addKeyword()
                  }
                }}
              />
              <Button type="button" onClick={addKeyword} variant="outline">
                Ekle
              </Button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tone */}
            <div className="space-y-2">
              <Label htmlFor="tone">Ton</Label>
              <Select
                value={formData.tone}
                onValueChange={(value: any) => setFormData({ ...formData, tone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profesyonel</SelectItem>
                  <SelectItem value="casual">Gündelik</SelectItem>
                  <SelectItem value="technical">Teknik</SelectItem>
                  <SelectItem value="friendly">Arkadaşça</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Word Count */}
            <div className="space-y-2">
              <Label htmlFor="wordCount">Kelime Sayısı</Label>
              <Select
                value={formData.wordCount.toString()}
                onValueChange={(value) => 
                  setFormData({ ...formData, wordCount: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">500 kelime</SelectItem>
                  <SelectItem value="1000">1000 kelime</SelectItem>
                  <SelectItem value="1500">1500 kelime</SelectItem>
                  <SelectItem value="2000">2000 kelime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Dil</Label>
            <Select
              value={formData.language}
              onValueChange={(value: any) => setFormData({ ...formData, language: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Türkçe</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
            İptal
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !formData.topic}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Oluştur
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
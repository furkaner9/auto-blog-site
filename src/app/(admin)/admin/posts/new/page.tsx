// src/app/(admin)/admin/posts/new/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { postsApi, categoriesApi } from '@/lib/api-client'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { TiptapEditor } from '@/components/admin/tiptap-editor'
import { AIGenerateDialog } from '@/components/admin/ai-generate-dialog'
import { 
  Save, 
  Eye, 
  Send, 
  X, 
  Image as ImageIcon,
  Calendar,
  Tag,
  Hash,
  FileText,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Form validation schema
const postFormSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık çok uzun'),
  slug: z.string().min(1, 'Slug gereklidir').regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire'),
  excerpt: z.string().max(300, 'Özet maksimum 300 karakter olabilir').optional(),
  content: z.string().min(1, 'İçerik gereklidir'),
  categoryId: z.string().min(1, 'Kategori seçmelisiniz'),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']),
  scheduledFor: z.string().optional(),
  metaTitle: z.string().max(60, 'Meta başlık maksimum 60 karakter').optional(),
  metaDescription: z.string().max(160, 'Meta açıklama maksimum 160 karakter').optional(),
  keywords: z.string().optional(),
})

type PostFormData = z.infer<typeof postFormSchema>

export default function NewPostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response: any = await categoriesApi.getAll({ activeOnly: true })
        setCategories(response.data)
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Kategoriler yüklenemedi')
      } finally {
        setIsLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      categoryId: '',
      tags: [],
      featuredImage: '',
      status: 'DRAFT',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
    },
  })

  const watchTitle = form.watch('title')
  const watchStatus = form.watch('status')

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (title: string) => {
    form.setValue('title', title)
    if (!form.formState.touchedFields.slug) {
      form.setValue('slug', generateSlug(title))
    }
  }

  const addTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Get actual authorId from session
      const authorId = 'admin-user-id' // Replace with actual auth
      
      // Keywords'ü array'e çevir
      const keywordsArray = data.keywords 
        ? data.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : []
      
      const postData = {
        ...data,
        authorId,
        content,
        tags: selectedTags,
        keywords: keywordsArray, // String'i array'e çevirdik
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      }

      const response: any = await postsApi.create(postData)
      
      toast.success('Başarılı!', {
        description: 'Yazı başarıyla oluşturuldu',
      })
      
      router.push('/admin/posts')
    } catch (error: any) {
      console.error('Error creating post:', error)
      toast.error('Hata!', {
        description: error.message || 'Yazı oluşturulamadı',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    form.setValue('status', 'DRAFT')
    form.handleSubmit(onSubmit)()
  }

  const handlePublish = () => {
    form.setValue('status', 'PUBLISHED')
    form.handleSubmit(onSubmit)()
  }

  const handleSchedule = () => {
    form.setValue('status', 'SCHEDULED')
    form.handleSubmit(onSubmit)()
  }

  const handleAIGenerate = (aiData: any) => {
    // AI'dan gelen verileri forma doldur
    form.setValue('title', aiData.title)
    form.setValue('slug', generateSlug(aiData.title))
    form.setValue('excerpt', aiData.excerpt)
    setContent(aiData.content)
    form.setValue('content', aiData.content)
    form.setValue('metaTitle', aiData.metaTitle)
    form.setValue('metaDescription', aiData.metaDescription)
    form.setValue('keywords', aiData.keywords.join(', '))
    setSelectedTags(aiData.suggestedTags || [])
    
    toast.success('Yazı formuna aktarıldı!', {
      description: 'İsterseniz düzenleyip yayınlayabilirsiniz'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yeni Yazı Oluştur</h1>
          <p className="text-muted-foreground">Blog için yeni bir yazı oluşturun</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <X className="mr-2 h-4 w-4" />
            İptal
          </Button>
          <AIGenerateDialog onGenerate={handleAIGenerate} />
          <Button variant="outline" onClick={() => window.open('/blog/preview', '_blank')}>
            <Eye className="mr-2 h-4 w-4" />
            Önizle
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Taslak Kaydet
          </Button>
          <Button onClick={handlePublish} disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            Yayınla
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Temel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Başlık <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Harika bir başlık yazın..."
                    {...form.register('title')}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug (URL) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    placeholder="yazı-url-slug"
                    {...form.register('slug')}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /blog/{form.watch('slug') || 'yazı-url-slug'}
                  </p>
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                  )}
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Özet</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Yazınızın kısa bir özeti..."
                    rows={3}
                    {...form.register('excerpt')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.watch('excerpt')?.length || 0}/300 karakter
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>İçerik</CardTitle>
                <CardDescription>
                  Yazınızın ana içeriğini buraya yazın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TiptapEditor
                  content={content}
                  onChange={(newContent) => {
                    setContent(newContent)
                    form.setValue('content', newContent)
                  }}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive mt-2">
                    {form.formState.errors.content.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  SEO Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="meta">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="meta">Meta Bilgiler</TabsTrigger>
                    <TabsTrigger value="keywords">Anahtar Kelimeler</TabsTrigger>
                  </TabsList>

                  <TabsContent value="meta" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta Başlık</Label>
                      <Input
                        id="metaTitle"
                        placeholder="SEO için optimize edilmiş başlık"
                        {...form.register('metaTitle')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {form.watch('metaTitle')?.length || 0}/60 karakter
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Açıklama</Label>
                      <Textarea
                        id="metaDescription"
                        placeholder="Arama motorlarında görünecek açıklama"
                        rows={3}
                        {...form.register('metaDescription')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {form.watch('metaDescription')?.length || 0}/160 karakter
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="keywords" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Anahtar Kelimeler</Label>
                      <Input
                        id="keywords"
                        placeholder="nextjs, react, typescript (virgülle ayırın)"
                        {...form.register('keywords')}
                      />
                      <p className="text-xs text-muted-foreground">
                        Virgülle ayırarak birden fazla kelime ekleyebilirsiniz
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Yayın Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={watchStatus}
                    onValueChange={(value) => form.setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Taslak</SelectItem>
                      <SelectItem value="PUBLISHED">Yayınla</SelectItem>
                      <SelectItem value="SCHEDULED">Zamanlanmış</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {watchStatus === 'SCHEDULED' && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledFor">Yayın Tarihi</Label>
                    <Input
                      id="scheduledFor"
                      type="datetime-local"
                      {...form.register('scheduledFor')}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Kategori
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={form.watch('categoryId')}
                  onValueChange={(value) => form.setValue('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <SelectItem value="loading" disabled>
                        Yükleniyor...
                      </SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Kategori bulunamadı
                      </SelectItem>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-destructive mt-2">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Etiketler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Etiket ekle..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Ekle
                  </Button>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Öne Çıkan Görsel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Görsel URL'si"
                  {...form.register('featuredImage')}
                />
                {form.watch('featuredImage') && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={form.watch('featuredImage')}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <Button type="button" variant="outline" className="w-full">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Medya Kütüphanesinden Seç
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
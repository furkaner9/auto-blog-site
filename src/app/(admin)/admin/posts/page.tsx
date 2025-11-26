// src/app/(admin)/admin/posts/page.tsx

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, MoreHorizontal, Eye, Edit, Trash2, Plus, Search, Filter } from 'lucide-react'

interface PostsPageProps {
  searchParams: {
    status?: string
    search?: string
  }
}

async function getPosts(status?: string, search?: string) {
  const where: any = {}

  if (status && status !== 'all') {
    where.status = status.toUpperCase()
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ]
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          name: true,
          color: true,
        },
      },
      _count: {
        select: {
          tags: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get counts for tabs
  const [total, published, draft, scheduled, archived] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
    prisma.post.count({ where: { status: 'SCHEDULED' } }),
    prisma.post.count({ where: { status: 'ARCHIVED' } }),
  ])

  return {
    posts,
    counts: {
      all: total,
      published,
      draft,
      scheduled,
      archived,
    },
  }
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { posts, counts } = await getPosts(searchParams.status, searchParams.search)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yazılar</h1>
          <p className="text-muted-foreground">
            Blog yazılarınızı yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Yazı
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.all}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yayında</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taslak</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zamanlanmış</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.scheduled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tüm Yazılar</CardTitle>
              <CardDescription>
                {posts.length} yazı bulundu
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Yazı ara..."
                  className="pl-8 w-[250px]"
                  defaultValue={searchParams.search}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={searchParams.status || 'all'}>
            <TabsList>
              <TabsTrigger value="all" asChild>
                <Link href="/admin/posts?status=all">
                  Tümü ({counts.all})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="published" asChild>
                <Link href="/admin/posts?status=published">
                  Yayında ({counts.published})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="draft" asChild>
                <Link href="/admin/posts?status=draft">
                  Taslak ({counts.draft})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="scheduled" asChild>
                <Link href="/admin/posts?status=scheduled">
                  Zamanlanmış ({counts.scheduled})
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={searchParams.status || 'all'} className="mt-6">
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henüz yazı yok</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    İlk blog yazınızı oluşturarak başlayın
                  </p>
                  <Button asChild>
                    <Link href="/admin/posts/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Yeni Yazı Oluştur
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Başlık</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Görüntülenme</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <Link 
                                href={`/admin/posts/${post.id}`}
                                className="font-medium hover:underline line-clamp-1"
                              >
                                {post.title}
                              </Link>
                              {post.isAIGenerated && (
                                <Badge variant="secondary" className="text-xs">
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: post.category.color || undefined,
                                color: post.category.color || undefined,
                              }}
                            >
                              {post.category.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                post.status === 'PUBLISHED' ? 'default' :
                                post.status === 'DRAFT' ? 'secondary' :
                                post.status === 'SCHEDULED' ? 'outline' :
                                'destructive'
                              }
                            >
                              {post.status === 'PUBLISHED' ? 'Yayında' :
                               post.status === 'DRAFT' ? 'Taslak' :
                               post.status === 'SCHEDULED' ? 'Zamanlanmış' :
                               'Arşiv'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              {formatNumber(post.views)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(post.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/blog/${post.slug}`} target="_blank">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Görüntüle
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/posts/${post.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Düzenle
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
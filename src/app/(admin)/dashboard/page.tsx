// src/app/(admin)/admin/dashboard/page.tsx

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  FileText, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Bot,
  Clock
} from 'lucide-react'

async function getDashboardStats() {
  // Get counts
  const [totalPosts, publishedPosts, draftPosts, scheduledPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
    prisma.post.count({ where: { status: 'SCHEDULED' } }),
  ])

  // Get views (sum of all published posts)
  const viewsData = await prisma.post.aggregate({
    where: { status: 'PUBLISHED' },
    _sum: { views: true },
  })
  const totalViews = viewsData._sum.views || 0

  // Get today's analytics
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayAnalytics = await prisma.siteAnalytics.findUnique({
    where: { date: today },
  })

  // Get yesterday's analytics for comparison
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const yesterdayAnalytics = await prisma.siteAnalytics.findUnique({
    where: { date: yesterday },
  })

  // Calculate changes
  const viewsChange = yesterdayAnalytics 
    ? ((todayAnalytics?.totalViews || 0) - yesterdayAnalytics.totalViews) / yesterdayAnalytics.totalViews * 100
    : 0

  const revenueChange = yesterdayAnalytics
    ? ((todayAnalytics?.totalRevenue || 0) - yesterdayAnalytics.totalRevenue) / yesterdayAnalytics.totalRevenue * 100
    : 0

  // Get recent posts
  const recentPosts = await prisma.post.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true, color: true } },
      author: { select: { name: true, image: true } },
    },
  })

  // Get top posts by views
  const topPosts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    take: 5,
    orderBy: { views: 'desc' },
    include: {
      category: { select: { name: true } },
    },
  })

  // Get AI usage
  const aiUsageToday = await prisma.aIUsage.aggregate({
    where: {
      createdAt: {
        gte: today,
      },
    },
    _sum: { cost: true },
    _count: true,
  })

  return {
    stats: {
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      totalViews,
      todayViews: todayAnalytics?.totalViews || 0,
      todayRevenue: todayAnalytics?.totalRevenue || 0,
      viewsChange,
      revenueChange,
    },
    recentPosts,
    topPosts,
    aiUsage: {
      cost: aiUsageToday._sum.cost || 0,
      requests: aiUsageToday._count,
    },
  }
}

export default async function AdminDashboard() {
  const { stats, recentPosts, topPosts, aiUsage } = await getDashboardStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Blog yönetim panelinize hoş geldiniz
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <FileText className="mr-2 h-4 w-4" />
            Yeni Yazı
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Yazı</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} yayında, {stats.draftPosts} taslak
            </p>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görüntülenme</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Bugün: {formatNumber(stats.todayViews)}</span>
              {stats.viewsChange !== 0 && (
                <span className={`ml-2 flex items-center ${stats.viewsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.viewsChange > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(stats.viewsChange).toFixed(1)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.revenueChange !== 0 && (
                <span className={`flex items-center ${stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueChange > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(stats.revenueChange).toFixed(1)}% dünden
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Kullanımı</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiUsage.requests}</div>
            <p className="text-xs text-muted-foreground">
              Bugün: {formatCurrency(aiUsage.cost)} maliyet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Son Yazılar</CardTitle>
            <CardDescription>En son eklenen blog yazıları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.image || undefined} />
                    <AvatarFallback>
                      {post.author.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <Link 
                      href={`/admin/posts/${post.id}`}
                      className="font-medium leading-none hover:underline line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${post.category.color || '#000'}20`,
                          color: post.category.color || '#000'
                        }}
                      >
                        {post.category.name}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={
                    post.status === 'PUBLISHED' ? 'default' :
                    post.status === 'DRAFT' ? 'secondary' :
                    'outline'
                  }>
                    {post.status === 'PUBLISHED' ? 'Yayında' :
                     post.status === 'DRAFT' ? 'Taslak' :
                     post.status === 'SCHEDULED' ? 'Zamanlanmış' :
                     'Arşiv'}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link href="/admin/posts">
                Tümünü Gör
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle>En Popüler Yazılar</CardTitle>
            <CardDescription>En çok görüntülenen içerikler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div key={post.id} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Link 
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="font-medium leading-none hover:underline line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{post.category.name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(post.views)} görüntülenme
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link href="/admin/analytics">
                Analytics'i Gör
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/admin/posts/new">
                <FileText className="h-6 w-6" />
                <span>Yeni Yazı Oluştur</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/admin/automation">
                <Bot className="h-6 w-6" />
                <span>AI Otomasyon</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/admin/analytics">
                <TrendingUp className="h-6 w-6" />
                <span>İstatistikleri Gör</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
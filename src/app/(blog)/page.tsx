// src/app/(blog)/page.tsx

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HeroSection } from '@/app/components/blog/hero-section'
import { PostCard } from '@/app/components/blog/post-card'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { calculateReadingTime } from '@/lib/utils'
import type { PostCardData } from '@/types'

async function getFeaturedPost(): Promise<PostCardData | null> {
  const post = await prisma.post.findFirst({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
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
          slug: true,
          color: true,
        },
      },
      tags: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      views: 'desc',
    },
  })

  if (!post) return null

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    featuredImage: post.featuredImage,
    publishedAt: post.publishedAt,
    views: post.views,
    category: post.category,
    author: post.author,
    readingTime: calculateReadingTime(post.content),
    tags: post.tags,
  }
}

async function getRecentPosts(): Promise<PostCardData[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
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
          slug: true,
          color: true,
        },
      },
      tags: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 6,
  })

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    featuredImage: post.featuredImage,
    publishedAt: post.publishedAt,
    views: post.views,
    category: post.category,
    author: post.author,
    readingTime: calculateReadingTime(post.content),
    tags: post.tags,
  }))
}

async function getTrendingPosts(): Promise<PostCardData[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Son 7 gün
      },
    },
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
          slug: true,
          color: true,
        },
      },
      tags: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      views: 'desc',
    },
    take: 4,
  })

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    featuredImage: post.featuredImage,
    publishedAt: post.publishedAt,
    views: post.views,
    category: post.category,
    author: post.author,
    readingTime: calculateReadingTime(post.content),
    tags: post.tags,
  }))
}

export default async function HomePage() {
  const [featuredPost, recentPosts, trendingPosts] = await Promise.all([
    getFeaturedPost(),
    getRecentPosts(),
    getTrendingPosts(),
  ])

  return (
    <div>
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12 border-t">
          <div className="container">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Öne Çıkan Yazı</h2>
            </div>
            <PostCard post={featuredPost} featured />
          </div>
        </section>
      )}

      {/* Recent Posts */}
      <section className="py-12 border-t">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Son Yazılar</h2>
            <Button variant="ghost" asChild>
              <Link href="/blog">
                Tümünü Gör
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Henüz yayınlanmış yazı bulunmuyor.</p>
              <p className="text-sm mt-2">
                İlk yazılar çok yakında burada olacak!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Posts */}
      {trendingPosts.length > 0 && (
        <section className="py-12 border-t bg-muted/30">
          <div className="container">
            <div className="flex items-center gap-2 mb-8">
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                Trend
              </Badge>
              <h2 className="text-2xl font-bold">Popüler Yazılar</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {trendingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-16 border-t">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-3xl font-bold">Bültene Abone Ol</h2>
            <p className="text-muted-foreground">
              Yeni yazılardan ve güncellemelerden haberdar olmak için e-posta
              adresinizi bırakın.
            </p>
            <div className="flex gap-2 max-w-md mx-auto pt-4">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button>Abone Ol</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Spam göndermiyoruz. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
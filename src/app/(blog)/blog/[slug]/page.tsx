// src/app/(blog)/blog/[slug]/page.tsx

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { formatDate, calculateReadingTime } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PostCard } from '@/app/components/blog/post-card'
import { Calendar, Clock, Eye, Share2, Twitter, Facebook, Linkedin } from 'lucide-react'
import type { PostCardData } from '@/types'

interface BlogDetailPageProps {
  params: {
    slug: string
  }
}

async function getPost(slug: string) {
  const post = await prisma.post.findUnique({
    where: {
      slug,
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
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
      analytics: true,
    },
  })

  if (!post) return null

  // Increment views
  await prisma.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  })

  return post
}

async function getRelatedPosts(categoryId: string, currentPostId: string): Promise<PostCardData[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
      categoryId,
      id: { not: currentPostId },
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
    take: 3,
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

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const post = await getPost(params.slug)

  if (!post) {
    return {
      title: 'Yazı Bulunamadı',
    }
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords,
    authors: [{ name: post.author.name || 'Anonim' }],
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name || 'Anonim'],
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.categoryId, post.id)
  const readingTime = calculateReadingTime(post.content)
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}`

  return (
    <article className="pb-12">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] w-full">
        {post.featuredImage && (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="container pb-12">
            <div className="max-w-4xl">
              <Badge 
                className="mb-4"
                style={{ 
                  backgroundColor: post.category.color || '#3B82F6',
                  color: 'white' 
                }}
              >
                {post.category.name}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={post.author.image || undefined} />
                    <AvatarFallback>
                      {post.author.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{post.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt!)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {readingTime} dakika
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.views} görüntülenme
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mt-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_300px] gap-12">
            {/* Article Content */}
            <div>
              {/* Excerpt */}
              {post.excerpt && (
                <div className="text-xl text-muted-foreground mb-8 font-medium leading-relaxed">
                  {post.excerpt}
                </div>
              )}

              <Separator className="my-8" />

              {/* Main Content */}
              <div 
                className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t">
                  <h3 className="text-sm font-semibold mb-3">Etiketler</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link key={tag.slug} href={`/blog?search=${tag.name}`}>
                        <Badge variant="secondary">#{tag.name}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Buttons */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-semibold mb-3">Bu yazıyı paylaş</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${post.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                </div>
              </div>

              {/* Author Bio */}
              <div className="mt-12 p-6 bg-muted rounded-lg">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={post.author.image || undefined} />
                    <AvatarFallback className="text-xl">
                      {post.author.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold mb-1">{post.author.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Teknoloji ve yapay zeka üzerine yazan bir içerik üreticisi.
                    </p>
                    <Button variant="outline" size="sm">
                      Diğer Yazıları
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Table of Contents - Opsiyonel */}
              <div className="sticky top-24">
                <div className="p-6 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-4">Bu Kategorideki Diğer Yazılar</h3>
                  <div className="space-y-4">
                    {relatedPosts.slice(0, 5).map((relatedPost) => (
                      <Link
                        key={relatedPost.id}
                        href={`/blog/${relatedPost.slug}`}
                        className="block group"
                      >
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(relatedPost.publishedAt!)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="container mt-16 pt-16 border-t">
          <h2 className="text-2xl font-bold mb-8">İlgili Yazılar</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <PostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
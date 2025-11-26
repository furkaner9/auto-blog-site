// src/app/(blog)/blog/page.tsx

import { Suspense } from 'react'
import { PostCard } from '@/app/components/blog/post-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { prisma } from '@/lib/prisma'
import { calculateReadingTime } from '@/lib/utils'
import { blogConfig } from '@/config/site'
import type { PostCardData } from '@/types'
import Link from 'next/link'

interface BlogPageProps {
  searchParams: {
    page?: string
    category?: string
    search?: string
  }
}

async function getPosts(page: number, searchParams: any): Promise<{
  posts: PostCardData[]
  totalPages: number
  currentPage: number
  totalPosts: number
}> {
  const pageSize = blogConfig.postsPerPage
  const skip = (page - 1) * pageSize

  // Build where clause
  const where: any = {
    status: 'PUBLISHED',
    publishedAt: { not: null },
  }

  if (searchParams.category) {
    where.category = {
      slug: searchParams.category,
    }
  }

  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { excerpt: { contains: searchParams.search, mode: 'insensitive' } },
      { content: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }

  // Get total count
  const totalPosts = await prisma.post.count({ where })

  // Get posts
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
          slug: true,
          color: true,
        },
      },
      tags: {
        select: {
          name: true,
          slug: true,
        },
        take: 3,
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    skip,
    take: pageSize,
  })

  const postsData: PostCardData[] = posts.map((post) => ({
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

  return {
    posts: postsData,
    totalPages: Math.ceil(totalPosts / pageSize),
    currentPage: page,
    totalPosts,
  }
}

async function getCategories() {
  return await prisma.category.findMany({
    where: { isActive: true },
    select: {
      name: true,
      slug: true,
      color: true,
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const currentPage = parseInt(searchParams.page || '1')
  
  const [{ posts, totalPages, totalPosts }, categories] = await Promise.all([
    getPosts(currentPage, searchParams),
    getCategories(),
  ])

  const hasFilters = searchParams.category || searchParams.search

  return (
    <div className="container py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Teknoloji, yapay zeka ve yazılım geliştirme dünyasından
            en güncel yazılar ve analizler.
          </p>
        </div>

        {/* Categories Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Link href="/blog">
              <Button 
                variant={!searchParams.category ? 'default' : 'outline'}
                size="sm"
              >
                Tümü ({totalPosts})
              </Button>
            </Link>
            {categories.map((category) => (
              <Link 
                key={category.slug} 
                href={`/blog?category=${category.slug}`}
              >
                <Button
                  variant={searchParams.category === category.slug ? 'default' : 'outline'}
                  size="sm"
                  style={
                    searchParams.category === category.slug
                      ? {
                          backgroundColor: category.color || '#3B82F6',
                          borderColor: category.color || '#3B82F6',
                        }
                      : undefined
                  }
                >
                  {category.name} ({category._count.posts})
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Search Info */}
        {hasFilters && (
          <div className="mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              {totalPosts} yazı bulundu
              {searchParams.category && (
                <> kategoride: <strong>{searchParams.category}</strong></>
              )}
              {searchParams.search && (
                <> arama: <strong>"{searchParams.search}"</strong></>
              )}
            </p>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {hasFilters
                ? 'Aradığınız kriterlere uygun yazı bulunamadı.'
                : 'Henüz yayınlanmış yazı bulunmuyor.'}
            </p>
            {hasFilters && (
              <Button asChild className="mt-4" variant="outline">
                <Link href="/blog">Tüm Yazıları Gör</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  asChild={currentPage > 1}
                >
                  {currentPage > 1 ? (
                    <Link href={`/blog?page=${currentPage - 1}${searchParams.category ? `&category=${searchParams.category}` : ''}`}>
                      Önceki
                    </Link>
                  ) : (
                    'Önceki'
                  )}
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first, last, current, and adjacent pages
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      )
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <div key={`ellipsis-${page}`} className="flex items-center gap-1">
                            <span className="px-2">...</span>
                            <Button
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              asChild
                            >
                              <Link href={`/blog?page=${page}${searchParams.category ? `&category=${searchParams.category}` : ''}`}>
                                {page}
                              </Link>
                            </Button>
                          </div>
                        )
                      }
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          asChild
                        >
                          <Link href={`/blog?page=${page}${searchParams.category ? `&category=${searchParams.category}` : ''}`}>
                            {page}
                          </Link>
                        </Button>
                      )
                    })}
                </div>

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  asChild={currentPage < totalPages}
                >
                  {currentPage < totalPages ? (
                    <Link href={`/blog?page=${currentPage + 1}${searchParams.category ? `&category=${searchParams.category}` : ''}`}>
                      Sonraki
                    </Link>
                  ) : (
                    'Sonraki'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Loading state
function PostCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2 pt-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}
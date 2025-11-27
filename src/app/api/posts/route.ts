import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSlug, generateMetaDescription } from '@/lib/utils'
import { z } from 'zod'

// Validation schema
const createPostSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200),
  slug: z.string().optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1, 'İçerik gereklidir'),
  categoryId: z.string().min(1, 'Kategori seçmelisiniz'),
  authorId: z.string().min(1, 'Yazar ID gereklidir'),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
  scheduledFor: z.string().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).optional(),
})

// GET /api/posts - Get all posts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.post.count({ where })

    // Get posts
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            tags: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { success: false, error: 'Yazılar getirilemedi' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createPostSchema.parse(body)

    // Generate slug if not provided
    const slug = validatedData.slug || createSlug(validatedData.title)

    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    })

    if (existingPost) {
      return NextResponse.json(
        { success: false, error: 'Bu slug zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Generate meta description if not provided
    const metaDescription = validatedData.metaDescription || 
      generateMetaDescription(validatedData.content)

    // Create post
    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        slug,
        excerpt: validatedData.excerpt || '',
        content: validatedData.content,
        featuredImage: validatedData.featuredImage || null,
        categoryId: validatedData.categoryId,
        authorId: validatedData.authorId,
        status: validatedData.status || 'DRAFT',
        scheduledFor: validatedData.scheduledFor 
          ? new Date(validatedData.scheduledFor) 
          : null,
        publishedAt: validatedData.status === 'PUBLISHED' 
          ? new Date() 
          : null,
        metaTitle: validatedData.metaTitle || validatedData.title,
        metaDescription,
        keywords: validatedData.keywords || [],
        tags: validatedData.tags ? {
          connectOrCreate: validatedData.tags.map((tagName) => ({
            where: { slug: createSlug(tagName) },
            create: {
              name: tagName,
              slug: createSlug(tagName),
            },
          })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: true,
      },
    })

    // Create analytics record
    await prisma.postAnalytics.create({
      data: {
        postId: post.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: post,
      message: 'Yazı başarıyla oluşturuldu',
    })
  } catch (error) {
    console.error('Error creating post:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veri', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Yazı oluşturulamadı' },
      { status: 500 }
    )
  }
}
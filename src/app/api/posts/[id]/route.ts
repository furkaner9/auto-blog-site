// src/app/api/posts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSlug, generateMetaDescription } from '@/lib/utils'
import { z } from 'zod'

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
  scheduledFor: z.string().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).optional(),
})

// GET /api/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const post = await prisma.post.findUnique({
      where: { id },
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
        analytics: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Yazı bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: post,
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { success: false, error: 'Yazı getirilemedi' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[id] - Update post
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    
    // Validate input
    const validatedData = updatePostSchema.parse(body)

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Yazı bulunamadı' },
        { status: 404 }
      )
    }

    // If slug is being updated, check if it's unique
    if (validatedData.slug && validatedData.slug !== existingPost.slug) {
      const slugExists = await prisma.post.findUnique({
        where: { slug: validatedData.slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Bu slug zaten kullanılıyor' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    // If title is updated and slug is not provided, generate new slug
    if (validatedData.title && !validatedData.slug) {
      updateData.slug = createSlug(validatedData.title)
    }

    // Update published date if status changes to PUBLISHED
    if (validatedData.status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date()
    }

    // Handle scheduled date
    if (validatedData.scheduledFor) {
      updateData.scheduledFor = new Date(validatedData.scheduledFor)
    }

    // Handle tags
    if (validatedData.tags) {
      // First, disconnect all existing tags
      await prisma.post.update({
        where: { id },
        data: {
          tags: {
            set: [],
          },
        },
      })

      // Then connect new tags
      updateData.tags = {
        connectOrCreate: validatedData.tags.map((tagName) => ({
          where: { slug: createSlug(tagName) },
          create: {
            name: tagName,
            slug: createSlug(tagName),
          },
        })),
      }
    }

    // Update post
    const post = await prisma.post.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: post,
      message: 'Yazı başarıyla güncellendi',
    })
  } catch (error) {
    console.error('Error updating post:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veri', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Yazı güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Yazı bulunamadı' },
        { status: 404 }
      )
    }

    // Delete post (analytics will be deleted automatically due to cascade)
    await prisma.post.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Yazı başarıyla silindi',
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { success: false, error: 'Yazı silinemedi' },
      { status: 500 }
    )
  }
}
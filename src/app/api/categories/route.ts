import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/lib/utils'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gereklidir').max(100),
  slug: z.string().optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Geçerli bir hex renk kodu girin').optional(),
  isActive: z.boolean().optional(),
})

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCount = searchParams.get('includeCount') === 'true'
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }

    const categories = await prisma.category.findMany({
      where,
      include: includeCount ? {
        _count: {
          select: {
            posts: true,
          },
        },
      } : undefined,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Kategoriler getirilemedi' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createCategorySchema.parse(body)

    // Generate slug if not provided
    const slug = validatedData.slug || createSlug(validatedData.name)

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Bu slug zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description || null,
        image: validatedData.image || null,
        color: validatedData.color || '#3B82F6',
        isActive: validatedData.isActive ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Kategori başarıyla oluşturuldu',
    })
  } catch (error) {
    console.error('Error creating category:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veri', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Kategori oluşturulamadı' },
      { status: 500 }
    )
  }
}
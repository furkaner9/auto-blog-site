// src/app/api/ai/generate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateBlogPost } from '@/lib/ai/gemini-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const generateSchema = z.object({
  topic: z.string().min(1, 'Konu gereklidir'),
  keywords: z.array(z.string()).optional(),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly']).optional(),
  wordCount: z.number().min(300).max(3000).optional(),
  language: z.enum(['tr', 'en']).optional(),
  categoryId: z.string().optional(),
})

// POST /api/ai/generate - Generate blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = generateSchema.parse(body)

    // Get category name if provided
    let categoryName = ''
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
        select: { name: true },
      })
      categoryName = category?.name || ''
    }

    // Generate blog post with AI
    const result = await generateBlogPost({
      topic: validatedData.topic,
      keywords: validatedData.keywords,
      tone: validatedData.tone,
      wordCount: validatedData.wordCount,
      language: validatedData.language,
      categoryName,
    })

    // Save AI usage to database
    await prisma.aIUsage.create({
      data: {
        model: 'gemini-2.5-flash',
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        cost: result.usage.cost,
        purpose: 'post_generation',
        success: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: result.post,
      usage: result.usage,
      message: 'Blog yazısı başarıyla oluşturuldu',
    })
  } catch (error: any) {
    console.error('Error in AI generate:', error)

    // Log failed attempt
    try {
      await prisma.aIUsage.create({
        data: {
          model: 'gemini-2.5-flash',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
          purpose: 'post_generation',
          success: false,
          error: error.message,
        },
      })
    } catch (dbError) {
      console.error('Failed to log AI usage:', dbError)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veri', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Blog yazısı oluşturulamadı' },
      { status: 500 }
    )
  }
}
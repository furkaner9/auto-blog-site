// src/app/api/ai/improve/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { improveContent } from '@/lib/ai/gemini-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const improveSchema = z.object({
  content: z.string().min(1, 'İçerik gereklidir'),
  instructions: z.string().min(1, 'İyileştirme talimatı gereklidir'),
})

// POST /api/ai/improve - Improve content with AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = improveSchema.parse(body)

    const result = await improveContent(
      validatedData.content,
      validatedData.instructions
    )

    // Save AI usage to database
    await prisma.aIUsage.create({
      data: {
        model: 'gemini-1.5-pro',
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        cost: result.usage.cost,
        purpose: 'content_improvement',
        success: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        improvedContent: result.improvedContent,
      },
      usage: result.usage,
    })
  } catch (error: any) {
    console.error('Error improving content:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veri', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'İçerik geliştirilemedi' },
      { status: 500 }
    )
  }
}
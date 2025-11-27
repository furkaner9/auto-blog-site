// src/app/api/ai/titles/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateTitleSuggestions } from '@/lib/ai/gemini-service'
import { z } from 'zod'

const titlesSchema = z.object({
  topic: z.string().min(1, 'Konu gereklidir'),
  count: z.number().min(1).max(10).optional(),
})

// POST /api/ai/titles - Generate title suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = titlesSchema.parse(body)

    const titles = await generateTitleSuggestions(
      validatedData.topic,
      validatedData.count || 5
    )

    return NextResponse.json({
      success: true,
      data: titles,
    })
  } catch (error: any) {
    console.error('Error generating titles:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veri', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Başlık önerileri oluşturulamadı' },
      { status: 500 }
    )
  }
}
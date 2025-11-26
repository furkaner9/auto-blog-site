// src/app/api/test/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Veritabanı bağlantısını test et
    await prisma.$connect()
    
    // Kategorileri say
    const categoryCount = await prisma.category.count()
    const postCount = await prisma.post.count()
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      stats: {
        categories: categoryCount,
        posts: postCount,
        users: userCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Database connection failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
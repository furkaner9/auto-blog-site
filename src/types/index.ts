// src/types/index.ts

import { Post, Category, Tag, User, PostStatus, AutomationFrequency } from '@prisma/client'

// ============================================
// Blog Types
// ============================================

export type PostWithRelations = Post & {
  author: User
  category: Category
  tags: Tag[]
  analytics?: {
    totalViews: number
    uniqueVisitors: number
    likes: number
  } | null
}

export type CategoryWithCount = Category & {
  _count: {
    posts: number
  }
}

export type PostCardData = {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage: string | null
  publishedAt: Date | null
  views: number
  category: {
    name: string
    slug: string
    color: string | null
  }
  author: {
    name: string | null
    image: string | null
  }
  readingTime: number
  tags: { name: string; slug: string }[]
}

// ============================================
// Form Types
// ============================================

export type CreatePostInput = {
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  categoryId: string
  tags?: string[]
  status?: PostStatus
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  scheduledFor?: Date
}

export type UpdatePostInput = Partial<CreatePostInput> & {
  id: string
}

export type CreateCategoryInput = {
  name: string
  description?: string
  image?: string
  color?: string
}

export type CreateAutomationRuleInput = {
  name: string
  description?: string
  frequency: AutomationFrequency
  time?: string
  daysOfWeek?: number[]
  categoryId?: string
  contentType?: string
  tone?: string
  wordCount?: number
  includeImages?: boolean
  promptTemplate: string
  keywords?: string[]
  useTrends?: boolean
}

// ============================================
// AI Types
// ============================================

export type AIGeneratePostRequest = {
  topic: string
  keywords?: string[]
  categoryId?: string
  tone?: 'professional' | 'casual' | 'technical' | 'friendly'
  wordCount?: number
  includeImages?: boolean
  language?: 'tr' | 'en'
}

export type AIGeneratePostResponse = {
  success: boolean
  data?: {
    title: string
    content: string
    excerpt: string
    metaTitle: string
    metaDescription: string
    keywords: string[]
    suggestedTags: string[]
    estimatedReadingTime: number
  }
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  }
}

export type AIModel = 'claude-sonnet-4' | 'claude-opus-4' | 'gpt-4' | 'gpt-3.5-turbo'

export type ContentTone = 'professional' | 'casual' | 'technical' | 'friendly' | 'formal' | 'conversational'

// ============================================
// Analytics Types
// ============================================

export type AnalyticsPeriod = 'today' | '7days' | '30days' | '90days' | 'all'

export type DashboardStats = {
  totalPosts: number
  publishedPosts: number
  totalViews: number
  totalRevenue: number
  todayViews: number
  todayRevenue: number
  postsChange: number // yüzde değişim
  viewsChange: number
  revenueChange: number
  topPosts: {
    id: string
    title: string
    views: number
    revenue: number
  }[]
  recentPosts: PostCardData[]
  categoryStats: {
    category: string
    posts: number
    views: number
  }[]
  trafficSources: {
    source: string
    percentage: number
    views: number
  }[]
}

export type PostAnalyticsData = {
  postId: string
  title: string
  views: number
  uniqueVisitors: number
  avgTimeOnPage: number
  bounceRate: number
  likes: number
  shares: number
  adRevenue: number
  affiliateRevenue: number
  viewsOverTime: {
    date: string
    views: number
  }[]
  trafficSources: {
    source: string
    views: number
  }[]
  topReferrers: {
    url: string
    views: number
  }[]
}

// ============================================
// API Response Types
// ============================================

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================
// Automation Types
// ============================================

export type AutomationRunResult = {
  success: boolean
  postId?: string
  error?: string
  duration: number // ms
  tokensUsed: number
  cost: number
}

export type ScheduledPostData = {
  id: string
  topic: string
  scheduledFor: Date
  status: string
  attempts: number
  error?: string | null
}

// ============================================
// Settings Types
// ============================================

export type SiteSettings = {
  siteName: string
  siteDescription: string
  siteUrl: string
  logo?: string
  favicon?: string
  defaultAuthorId: string
  postsPerPage: number
  enableComments: boolean
  enableLikes: boolean
  enableSearch: boolean
}

export type AISettings = {
  defaultModel: AIModel
  defaultTone: ContentTone
  defaultWordCount: number
  includeImages: boolean
  autoPublish: boolean
  dailyPostLimit: number
  monthlyBudget: number
}

export type MonetizationSettings = {
  enableAdsense: boolean
  adsenseClientId?: string
  enableAffiliate: boolean
  affiliateNetworks: string[]
  minRevenueThreshold: number
}

// ============================================
// Media Types
// ============================================

export type MediaFile = {
  id: string
  fileName: string
  url: string
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  size: number
  width?: number | null
  height?: number | null
  alt?: string | null
  caption?: string | null
  createdAt: Date
}

export type UploadResponse = {
  success: boolean
  url?: string
  fileName?: string
  size?: number
  error?: string
}

// ============================================
// Filter & Sort Types
// ============================================

export type PostFilter = {
  status?: PostStatus | PostStatus[]
  categoryId?: string
  authorId?: string
  search?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  isAIGenerated?: boolean
}

export type PostSort = {
  field: 'createdAt' | 'publishedAt' | 'views' | 'title' | 'updatedAt'
  order: 'asc' | 'desc'
}

export type PaginationParams = {
  page?: number
  pageSize?: number
}

// ============================================
// Notification Types
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// ============================================
// User Preferences
// ============================================

export type UserPreferences = {
  theme: 'light' | 'dark' | 'system'
  language: 'tr' | 'en'
  emailNotifications: boolean
  dashboardLayout: 'grid' | 'list'
  defaultPostStatus: PostStatus
}

// ============================================
// Export all Prisma types
// ============================================

export type {
  Post,
  Category,
  Tag,
  User,
  PostStatus,
  AutomationFrequency,
} from '@prisma/client'
// src/lib/api-client.ts

import type { CreatePostInput, UpdatePostInput, CreateCategoryInput } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || 'Bir hata oluştu',
      data.details
    )
  }

  return data
}

// ============================================
// Posts API
// ============================================

export const postsApi = {
  // Get all posts
  getAll: async (params?: {
    status?: string
    categoryId?: string
    search?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const searchParams = new URLSearchParams()
    
    if (params?.status) searchParams.append('status', params.status)
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString())
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder)

    const query = searchParams.toString()
    return fetchApi(`/api/posts${query ? `?${query}` : ''}`, {
      method: 'GET',
    })
  },

  // Get single post
  getById: async (id: string) => {
    return fetchApi(`/api/posts/${id}`, {
      method: 'GET',
    })
  },

  // Create post
  create: async (data: CreatePostInput & { authorId: string }) => {
    return fetchApi('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update post
  update: async (id: string, data: Partial<UpdatePostInput>) => {
    return fetchApi(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete post
  delete: async (id: string) => {
    return fetchApi(`/api/posts/${id}`, {
      method: 'DELETE',
    })
  },
}

// ============================================
// Categories API
// ============================================

export const categoriesApi = {
  // Get all categories
  getAll: async (params?: {
    includeCount?: boolean
    activeOnly?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    
    if (params?.includeCount) searchParams.append('includeCount', 'true')
    if (params?.activeOnly) searchParams.append('activeOnly', 'true')

    const query = searchParams.toString()
    return fetchApi(`/api/categories${query ? `?${query}` : ''}`, {
      method: 'GET',
    })
  },

  // Get single category
  getById: async (id: string) => {
    return fetchApi(`/api/categories/${id}`, {
      method: 'GET',
    })
  },

  // Create category
  create: async (data: CreateCategoryInput) => {
    return fetchApi('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update category
  update: async (id: string, data: Partial<CreateCategoryInput>) => {
    return fetchApi(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete category
  delete: async (id: string) => {
    return fetchApi(`/api/categories/${id}`, {
      method: 'DELETE',
    })
  },
}

// ============================================
// AI API
// ============================================

export const aiApi = {
  // Generate blog post
  generatePost: async (data: {
    topic: string
    keywords?: string[]
    tone?: 'professional' | 'casual' | 'technical' | 'friendly'
    wordCount?: number
    language?: 'tr' | 'en'
    categoryId?: string
  }) => {
    return fetchApi('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Generate title suggestions
  generateTitles: async (data: {
    topic: string
    count?: number
  }) => {
    return fetchApi('/api/ai/titles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Improve content
  improveContent: async (data: {
    content: string
    instructions: string
  }) => {
    return fetchApi('/api/ai/improve', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ============================================
// Export all
// ============================================

export { ApiError }
export default {
  posts: postsApi,
  categories: categoriesApi,
  ai: aiApi,
}
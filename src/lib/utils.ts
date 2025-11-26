// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import slugify from "slugify"

/**
 * Tailwind CSS class'larını merge eder
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * String'i URL-friendly slug'a çevirir
 */
export function createSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'tr', // Türkçe karakter desteği
  })
}

/**
 * Tarihi okunabilir formata çevirir
 */
export function formatDate(date: Date | string, locale: string = 'tr-TR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

/**
 * Tarihi "2 saat önce" gibi relative formata çevirir
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  const intervals = {
    yıl: 31536000,
    ay: 2592000,
    hafta: 604800,
    gün: 86400,
    saat: 3600,
    dakika: 60,
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit} önce`
    }
  }

  return 'Az önce'
}

/**
 * Okuma süresini hesaplar (dakika)
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const readingTime = Math.ceil(words / wordsPerMinute)
  return readingTime
}

/**
 * Metni belirtilen karakter sayısına kısaltır
 */
export function truncateText(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * HTML etiketlerini temizler
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Sayıyı formatlar (1000 -> 1K)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Para formatı (Türk Lirası)
 */
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Yüzdelik formatı
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Random renk üretir (kategori için)
 */
export function generateRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#06B6D4', // cyan
    '#6366F1', // indigo
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Dosya boyutunu okunabilir formata çevirir
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Email validasyonu
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * URL validasyonu
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Metinden ilk resim URL'ini çıkarır
 */
export function extractFirstImage(html: string): string | null {
  const imgRegex = /<img[^>]+src="([^">]+)"/
  const match = html.match(imgRegex)
  return match ? match[1] : null
}

/**
 * SEO-friendly meta description oluşturur
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  const plainText = stripHtml(content)
  return truncateText(plainText, maxLength)
}

/**
 * Keyword array'ini string'e çevirir
 */
export function keywordsToString(keywords: string[]): string {
  return keywords.join(', ')
}

/**
 * String'i keyword array'ine çevirir
 */
export function stringToKeywords(str: string): string[] {
  return str
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0)
}

/**
 * Unique ID generator (cuid alternatifi)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Sleep/delay fonksiyonu
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Debounce fonksiyonu
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}
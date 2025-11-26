// src/components/blog/post-card.tsx

import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatNumber, calculateReadingTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Eye, Clock } from 'lucide-react'
import type { PostCardData } from '@/types'

interface PostCardProps {
  post: PostCardData
  featured?: boolean
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const readingTime = post.readingTime || 5

  if (featured) {
    return (
      <Link 
        href={`/blog/${post.slug}`}
        className="group block overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative h-64 md:h-full overflow-hidden">
            <Image
              src={post.featuredImage || '/images/default-post.jpg'}
              alt={post.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute top-4 left-4">
              <Badge 
                className="font-semibold"
                style={{ 
                  backgroundColor: post.category.color || '#3B82F6',
                  color: 'white' 
                }}
              >
                {post.category.name}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {post.excerpt}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishedAt!)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readingTime} dk
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {formatNumber(post.views)}
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author.image || undefined} />
                <AvatarFallback>
                  {post.author.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {post.author.name || 'Anonim'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link 
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={post.featuredImage || '/images/default-post.jpg'}
          alt={post.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <Badge 
            className="font-semibold text-xs"
            style={{ 
              backgroundColor: post.category.color || '#3B82F6',
              color: 'white' 
            }}
          >
            {post.category.name}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readingTime} dk
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(post.views)}
            </div>
          </div>
          <span>{formatDate(post.publishedAt!)}</span>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.author.image || undefined} />
            <AvatarFallback className="text-xs">
              {post.author.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">
            {post.author.name || 'Anonim'}
          </span>
        </div>
      </div>
    </Link>
  )
}
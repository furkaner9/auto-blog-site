// src/components/blog/hero-section.tsx

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      {/* Content */}
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Destekli İçerik Platformu
          </Badge>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Güncel Teknoloji ve{' '}
            <span className="text-primary">Yapay Zeka</span>{' '}
            Haberleri
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Yapay zeka, yazılım geliştirme ve teknoloji dünyasından en güncel
            haberler ve derinlemesine analizler.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/blog">
                Blog'u Keşfet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/categories">Kategoriler</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 pt-8 text-sm">
            <div className="text-center">
              <div className="font-bold text-2xl text-primary">500+</div>
              <div className="text-muted-foreground">Makale</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="font-bold text-2xl text-primary">50K+</div>
              <div className="text-muted-foreground">Okuyucu</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="font-bold text-2xl text-primary">Günlük</div>
              <div className="text-muted-foreground">Güncelleme</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
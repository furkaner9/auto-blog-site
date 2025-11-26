// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autoblog.com' },
    update: {},
    create: {
      email: 'admin@autoblog.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'yapay-zeka' },
      update: {},
      create: {
        name: 'Yapay Zeka',
        slug: 'yapay-zeka',
        description: 'AI ve makine öğrenimi üzerine yazılar',
        color: '#8B5CF6',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'web-gelistirme' },
      update: {},
      create: {
        name: 'Web Geliştirme',
        slug: 'web-gelistirme',
        description: 'Modern web teknolojileri ve framework\'ler',
        color: '#3B82F6',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'teknoloji' },
      update: {},
      create: {
        name: 'Teknoloji',
        slug: 'teknoloji',
        description: 'Teknoloji dünyasından haberler ve trendler',
        color: '#10B981',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'programlama' },
      update: {},
      create: {
        name: 'Programlama',
        slug: 'programlama',
        description: 'Programlama dilleri ve best practice\'ler',
        color: '#F59E0B',
        isActive: true,
      },
    }),
  ])

  console.log(`✅ ${categories.length} categories created`)

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'nextjs' },
      update: {},
      create: { name: 'Next.js', slug: 'nextjs' },
    }),
    prisma.tag.upsert({
      where: { slug: 'react' },
      update: {},
      create: { name: 'React', slug: 'react' },
    }),
    prisma.tag.upsert({
      where: { slug: 'typescript' },
      update: {},
      create: { name: 'TypeScript', slug: 'typescript' },
    }),
    prisma.tag.upsert({
      where: { slug: 'ai' },
      update: {},
      create: { name: 'AI', slug: 'ai' },
    }),
    prisma.tag.upsert({
      where: { slug: 'chatgpt' },
      update: {},
      create: { name: 'ChatGPT', slug: 'chatgpt' },
    }),
  ])

  console.log(`✅ ${tags.length} tags created`)

  // Create sample posts
  const posts: any[] = [
    {
      title: 'Next.js 16 ile Modern Web Uygulamaları Geliştirme',
      slug: 'nextjs-16-modern-web-uygulamalari',
      excerpt: 'Next.js 16 ile birlikte gelen yeni özellikler ve performans iyileştirmeleri hakkında kapsamlı bir rehber.',
      content: `
        <h2>Giriş</h2>
        <p>Next.js 16, modern web uygulamaları geliştirmek için güçlü araçlar sunan bir React framework'üdür. Bu yazıda, Next.js 16 ile neler yapabileceğinizi keşfedeceğiz.</p>
        
        <h2>Yeni Özellikler</h2>
        <p>Next.js 16 birçok yeni özellik ve iyileştirme ile geliyor:</p>
        <ul>
          <li>Turbopack: Daha hızlı build süreleri</li>
          <li>Server Actions: Geliştirilmiş server-side işlemler</li>
          <li>Partial Prerendering: Hibrit rendering stratejisi</li>
        </ul>

        <h2>Performans İyileştirmeleri</h2>
        <p>Yeni sürüm, özellikle büyük projelerde dikkat çekici performans artışları sağlıyor. Build süreleri %70'e varan oranlarda azalırken, runtime performansı da önemli ölçüde iyileşti.</p>

        <h2>Sonuç</h2>
        <p>Next.js 16, web geliştirme deneyimini bir üst seviyeye taşıyan özelliklerle dolu. Projelerinizde denemenizi kesinlikle öneririz.</p>
      `,
      categoryId: categories[1].id,
      authorId: admin.id,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      views: 1250,
      featuredImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
      metaTitle: 'Next.js 16 Rehberi - Modern Web Geliştirme',
      metaDescription: 'Next.js 16 ile modern web uygulamaları nasıl geliştirilir? Detaylı rehber ve örnekler.',
      keywords: ['nextjs', 'react', 'web development', 'javascript'],
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[1].id }, { id: tags[2].id }],
      },
    },
    {
      title: 'ChatGPT ve Claude: Yapay Zeka Asistanları Karşılaştırması',
      slug: 'chatgpt-claude-karsilastirmasi',
      excerpt: 'İki popüler AI asistanı olan ChatGPT ve Claude\'u detaylı olarak karşılaştırıyor, güçlü ve zayıf yönlerini inceliyoruz.',
      content: `
        <h2>Yapay Zeka Asistanları</h2>
        <p>Günümüzde iki büyük AI asistanı ön plana çıkıyor: OpenAI'ın ChatGPT'si ve Anthropic'in Claude'u. Her ikisi de güçlü yeteneklere sahip ancak farklı özellikleri var.</p>
        
        <h2>ChatGPT</h2>
        <p>ChatGPT, OpenAI tarafından geliştirilen ve dünya çapında milyonlarca kullanıcıya sahip bir dil modelidir. Geniş bilgi tabanı ve yaratıcı yetenekleriyle öne çıkar.</p>

        <h2>Claude</h2>
        <p>Anthropic'in geliştirdiği Claude, özellikle güvenlik ve etik konulara odaklanır. Uzun bağlam penceresi ve analitik yetenekleriyle dikkat çeker.</p>

        <h2>Karşılaştırma</h2>
        <p>Her iki model de farklı kullanım senaryoları için uygundur. ChatGPT daha yaratıcı görevlerde, Claude ise analitik ve uzun döküman işleme görevlerinde öne çıkar.</p>
      `,
      categoryId: categories[0].id,
      authorId: admin.id,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      views: 3420,
      featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
      metaTitle: 'ChatGPT vs Claude - Hangi AI Asistanı Daha İyi?',
      metaDescription: 'ChatGPT ve Claude karşılaştırması. İki AI asistanının güçlü ve zayıf yönleri.',
      keywords: ['chatgpt', 'claude', 'ai', 'artificial intelligence'],
      tags: {
        connect: [{ id: tags[3].id }, { id: tags[4].id }],
      },
    },
    {
      title: 'TypeScript ile Tip Güvenli Kod Yazma',
      slug: 'typescript-tip-guvenli-kod',
      excerpt: 'TypeScript kullanarak nasıl daha güvenli ve sürdürülebilir kod yazabileceğinizi öğrenin.',
      content: `
        <h2>TypeScript Nedir?</h2>
        <p>TypeScript, JavaScript'e statik tip desteği ekleyen bir programlama dilidir. Microsoft tarafından geliştirilmiştir.</p>
        
        <h2>Neden TypeScript?</h2>
        <p>TypeScript kullanmanın birçok avantajı vardır:</p>
        <ul>
          <li>Derleme zamanında hata yakalama</li>
          <li>Daha iyi IDE desteği</li>
          <li>Kod okunabilirliği</li>
          <li>Refactoring kolaylığı</li>
        </ul>

        <h2>Başlarken</h2>
        <p>TypeScript ile başlamak oldukça kolaydır. NPM üzerinden kurulum yapabilir ve hemen kullanmaya başlayabilirsiniz.</p>
      `,
      categoryId: categories[3].id,
      authorId: admin.id,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      views: 890,
      featuredImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
      metaTitle: 'TypeScript Rehberi - Tip Güvenli Kod Yazma',
      metaDescription: 'TypeScript ile nasıl daha güvenli kod yazılır? Detaylı rehber.',
      keywords: ['typescript', 'javascript', 'programming', 'web development'],
      tags: {
        connect: [{ id: tags[2].id }],
      },
    },
  ]

  for (const postData of posts) {
    const post = await prisma.post.create({
      data: postData,
    })
    console.log(`✅ Post created: ${post.title}`)

    // Create analytics for post
    await prisma.postAnalytics.create({
      data: {
        postId: post.id,
        totalViews: post.views,
        uniqueVisitors: Math.floor(post.views * 0.7),
        avgTimeOnPage: Math.floor(Math.random() * 300) + 120,
        bounceRate: Math.random() * 0.5 + 0.2,
        organicViews: Math.floor(post.views * 0.6),
        socialViews: Math.floor(post.views * 0.2),
        directViews: Math.floor(post.views * 0.2),
      },
    })
  }

  console.log('✅ Sample posts created with analytics')

  // Create site analytics for last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    await prisma.siteAnalytics.create({
      data: {
        date,
        totalViews: Math.floor(Math.random() * 1000) + 500,
        uniqueVisitors: Math.floor(Math.random() * 700) + 300,
        newVisitors: Math.floor(Math.random() * 300) + 100,
        totalRevenue: Math.random() * 100 + 20,
        adRevenue: Math.random() * 50 + 10,
        affiliateRevenue: Math.random() * 50 + 10,
        aiRequests: Math.floor(Math.random() * 50) + 10,
        aiCost: Math.random() * 10 + 2,
        postsGenerated: Math.floor(Math.random() * 5) + 1,
      },
    })
  }

  console.log('✅ Site analytics created for last 7 days')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
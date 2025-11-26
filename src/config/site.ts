// src/config/site.ts

export const siteConfig = {
  name: "AutoBlog",
  description: "AI destekli otomatik blog platformu",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: "/og-image.jpg",
  links: {
    twitter: "https://twitter.com/yourusername",
    github: "https://github.com/yourusername",
  },
  creator: {
    name: "Your Name",
    url: "https://yourwebsite.com",
  },
}

export const navConfig = {
  mainNav: [
    {
      title: "Ana Sayfa",
      href: "/",
    },
    {
      title: "Blog",
      href: "/blog",
    },
    {
      title: "Kategoriler",
      href: "/categories",
    },
    {
      title: "Hakkında",
      href: "/about",
    },
  ],
  adminNav: [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: "LayoutDashboard",
    },
    {
      title: "Yazılar",
      href: "/admin/posts",
      icon: "FileText",
    },
    {
      title: "Kategoriler",
      href: "/admin/categories",
      icon: "FolderTree",
    },
    {
      title: "Otomasyon",
      href: "/admin/automation",
      icon: "Bot",
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: "BarChart3",
    },
    {
      title: "Medya",
      href: "/admin/media",
      icon: "Image",
    },
    {
      title: "Ayarlar",
      href: "/admin/settings",
      icon: "Settings",
    },
  ],
}

export const blogConfig = {
  postsPerPage: 12,
  excerptLength: 160,
  defaultFeaturedImage: "/images/default-post.jpg",
  enableComments: true,
  enableLikes: true,
  enableSocialShare: true,
}

export const aiConfig = {
  defaultModel: "claude-sonnet-4" as const,
  defaultTone: "professional" as const,
  defaultWordCount: 1000,
  includeImagesDefault: true,
  maxDailyPosts: 10,
  maxTokensPerRequest: 4096,
  
  // Model costs (per 1K tokens - örnek fiyatlar)
  modelCosts: {
    "claude-sonnet-4": {
      input: 0.003,
      output: 0.015,
    },
    "claude-opus-4": {
      input: 0.015,
      output: 0.075,
    },
    "gpt-4": {
      input: 0.03,
      output: 0.06,
    },
    "gpt-3.5-turbo": {
      input: 0.0005,
      output: 0.0015,
    },
  },
  
  tones: [
    { value: "professional", label: "Profesyonel" },
    { value: "casual", label: "Gündelik" },
    { value: "technical", label: "Teknik" },
    { value: "friendly", label: "Arkadaşça" },
    { value: "formal", label: "Resmi" },
    { value: "conversational", label: "Sohbet Tarzı" },
  ],
}

export const automationConfig = {
  frequencies: [
    { value: "HOURLY", label: "Saatlik" },
    { value: "DAILY", label: "Günlük" },
    { value: "WEEKLY", label: "Haftalık" },
    { value: "MONTHLY", label: "Aylık" },
  ],
  
  daysOfWeek: [
    { value: 1, label: "Pazartesi" },
    { value: 2, label: "Salı" },
    { value: 3, label: "Çarşamba" },
    { value: 4, label: "Perşembe" },
    { value: 5, label: "Cuma" },
    { value: 6, label: "Cumartesi" },
    { value: 0, label: "Pazar" },
  ],
  
  contentTypes: [
    { value: "tutorial", label: "Eğitim/Tutorial" },
    { value: "news", label: "Haber" },
    { value: "review", label: "İnceleme" },
    { value: "guide", label: "Rehber" },
    { value: "listicle", label: "Liste Yazısı" },
    { value: "comparison", label: "Karşılaştırma" },
    { value: "howto", label: "Nasıl Yapılır" },
  ],
  
  defaultPromptTemplate: `Konu: {topic}
Ton: {tone}
Kelime Sayısı: {wordCount}
Anahtar Kelimeler: {keywords}

Lütfen yukarıdaki konuda SEO uyumlu, ilgi çekici bir blog yazısı oluştur. 
Yazı başlık, giriş, ana içerik ve sonuç bölümlerinden oluşmalı.
`,
}

export const monetizationConfig = {
  adsense: {
    enabled: false,
    clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
    slots: {
      header: "",
      sidebar: "",
      inContent: "",
      footer: "",
    },
  },
  
  affiliate: {
    enabled: false,
    networks: [
      { name: "Amazon Associates", url: "https://affiliate-program.amazon.com" },
      { name: "CJ Affiliate", url: "https://www.cj.com" },
      { name: "ShareASale", url: "https://www.shareasale.com" },
    ],
  },
}

export const analyticsConfig = {
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || "",
  microsoftClarityId: process.env.NEXT_PUBLIC_CLARITY_ID || "",
  
  // Custom events
  events: {
    pageView: "page_view",
    postView: "post_view",
    postLike: "post_like",
    postShare: "post_share",
    adClick: "ad_click",
    affiliateClick: "affiliate_click",
  },
}

export const uploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  allowedVideoTypes: ["video/mp4", "video/webm"],
  allowedDocumentTypes: ["application/pdf", "application/msword"],
}

export const seoConfig = {
  defaultKeywords: [
    "blog",
    "teknoloji",
    "yapay zeka",
    "otomatik içerik",
  ],
  
  socialMediaHandles: {
    twitter: "@yourusername",
    facebook: "yourpage",
    instagram: "yourprofile",
    linkedin: "yourcompany",
  },
  
  structuredData: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
  },
}

export const rateLimit = {
  ai: {
    requests: 100, // saatlik
    window: 60 * 60 * 1000, // 1 saat
  },
  
  api: {
    requests: 1000, // saatlik
    window: 60 * 60 * 1000,
  },
}
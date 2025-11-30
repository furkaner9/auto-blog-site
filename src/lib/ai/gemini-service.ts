// src/lib/ai/gemini-service.ts

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface GenerateBlogPostOptions {
  topic: string
  keywords?: string[]
  tone?: 'professional' | 'casual' | 'technical' | 'friendly'
  wordCount?: number
  language?: 'tr' | 'en'
  categoryName?: string
}

export interface GeneratedBlogPost {
  title: string
  content: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  suggestedTags: string[]
  estimatedReadingTime: number
}

export interface AIUsageStats {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
}

// Gemini 2.5 Flash pricing (ultra ucuz ve hızlı!)
const TOKEN_COSTS = {
  input: 0.0 / 1000,   // FREE tier: 15 RPM, 1 million TPM
  output: 0.0 / 1000,  // FREE tier için ücretsiz
  // Paid: $0.075 per 1M input tokens, $0.30 per 1M output tokens
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * TOKEN_COSTS.input) + (outputTokens * TOKEN_COSTS.output)
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

export async function generateBlogPost(
  options: GenerateBlogPostOptions
): Promise<{ post: GeneratedBlogPost; usage: AIUsageStats }> {
  const {
    topic,
    keywords = [],
    tone = 'professional',
    wordCount = 1000,
    language = 'tr',
    categoryName = '',
  } = options

  // Gemini 2.5 Flash modelini başlat
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 16384, // Daha yüksek limit
    },
  })

  // Prompt oluştur
  const prompt = buildPrompt({
    topic,
    keywords,
    tone,
    wordCount,
    language,
    categoryName,
  })

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse response
    const parsedContent = parseGeminiResponse(text)

    // Token estimation (Gemini henüz usage bilgisi vermiyor, tahmin ediyoruz)
    const promptTokens = estimateTokens(prompt)
    const completionTokens = estimateTokens(text)
    
    const usage: AIUsageStats = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost: calculateCost(promptTokens, completionTokens),
    }

    return {
      post: parsedContent,
      usage,
    }
  } catch (error) {
    console.error('Error generating blog post:', error)
    throw new Error('Blog yazısı oluşturulamadı: ' + (error as Error).message)
  }
}

function buildPrompt(options: GenerateBlogPostOptions): string {
  const { topic, keywords = [], tone = 'professional', wordCount = 1000, language = 'tr', categoryName = '' } = options

  const toneDescriptions: Record<string, string> = {
    professional: 'profesyonel ve resmi',
    casual: 'samimi ve rahat',
    technical: 'teknik ve detaylı',
    friendly: 'arkadaşça ve yakın',
  }

  const languageInstructions = language === 'tr' 
    ? 'Türkçe yazmalısın. Türkçe dilbilgisi kurallarına dikkat et.'
    : 'Write in English. Follow proper English grammar rules.'

  return `Sen profesyonel bir blog yazarısın. Aşağıdaki kriterlere göre SEO uyumlu, ilgi çekici bir blog yazısı oluştur.

**KONU:** ${topic}
${categoryName ? `**KATEGORİ:** ${categoryName}` : ''}
${keywords.length > 0 ? `**ANAHTAR KELİMELER:** ${keywords.join(', ')}` : ''}
**TON:** ${toneDescriptions[tone]}
**HEDEF UZUNLUK:** ${wordCount} kelime (ZORUNLU - Bu uzunluğa ulaşmalısın!)
**DİL:** ${languageInstructions}

**ÇOK ÖNEMLİ:**
- İçerik EN AZ ${wordCount} kelime olmalı!
- Kısa özet değil, TAM bir blog yazısı yaz!
- Her bölüm detaylı olmalı (minimum 3-4 paragraf)

**İÇERİK YAPISI:**

1. **Giriş Bölümü** (2-3 paragraf)
   - Konuyu tanıt ve önemini vurgula
   - Okuyucunun ilgisini çek
   - Yazıda neler öğreneceğini açıkla

2. **Ana Bölümler** (3-5 bölüm, her biri 3-4 paragraf)
   - Her ana konu için H2 başlığı kullan
   - Alt konular için H3 başlıkları ekle
   - Örnekler, listeler ve açıklamalar ekle
   - Detaylı ve kapsamlı bilgi ver

3. **Sonuç Bölümü** (2 paragraf)
   - Önemli noktaları özetle
   - Okuyucuya tavsiyelerde bulun

**HTML FORMATI:**
- Düzgün HTML kullan: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>
- Her paragraf <p> tagında olmalı
- Listeler için <ul> veya <ol> kullan

**SEO:**
- Anahtar kelimeleri doğal şekilde yerleştir
- Başlıklar SEO uyumlu olmalı

**ÇIKTI FORMATI:**
Yanıtını SADECE ve SADECE aşağıdaki JSON formatında ver. 

ÇOK ÖNEMLİ:
- JSON dışında HİÇBİR metin yazma!
- Açıklama yapma, yorum ekleme!
- JSON'dan önce veya sonra hiçbir şey yazma!
- Geçerli JSON formatı kullan (trailing comma yok, tırnak işaretleri doğru)
- Content içinde newline varsa \\n kullan

\`\`\`json
{
  "title": "Blog yazısının başlığı (max 60 karakter)",
  "content": "<h2>Giriş</h2><p>Detaylı giriş paragrafı...</p><h2>Ana Bölüm 1</h2><p>Detaylı içerik...</p>",
  "excerpt": "150-200 kelimelik kısa özet",
  "metaTitle": "SEO başlık (max 60 karakter)",
  "metaDescription": "SEO açıklama (max 160 karakter)",
  "keywords": ["anahtar1", "anahtar2", "anahtar3", "anahtar4", "anahtar5"],
  "suggestedTags": ["etiket1", "etiket2", "etiket3", "etiket4"]
}
\`\`\`

ÖNEMLİ HATIRLATMA:
- "content" alanı ${wordCount} kelime civarında UZUN HTML içerik
- "excerpt" alanı 150-200 kelimelik KISA özet
- Karıştırma! Content uzun, Excerpt kısa!`
}

function parseGeminiResponse(responseText: string): GeneratedBlogPost {
  try {
    console.log('=== RAW GEMINI RESPONSE ===')
    console.log(responseText.substring(0, 1000)) // İlk 1000 karakter
    console.log('===========================')
    
    // JSON bloğunu bul
    let jsonString = ''
    
    // Önce ```json ... ``` formatını dene
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim()
    } else {
      // Markdown yoksa, { ile } arasındaki kısmı al
      const startIndex = responseText.indexOf('{')
      const endIndex = responseText.lastIndexOf('}')
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonString = responseText.substring(startIndex, endIndex + 1)
      } else {
        throw new Error('JSON formatı bulunamadı')
      }
    }

    console.log('=== EXTRACTED JSON (first 500 chars) ===')
    console.log(jsonString.substring(0, 500))
    console.log('========================================')

    // JSON'u temizle - yaygın hataları düzelt
    let cleanedJson = jsonString
      // Trailing commas'ı temizle
      .replace(/,(\s*[}\]])/g, '$1')
      // Kaçışsız newline'ları düzelt
      .replace(/([^\\])"([^"]*)\n([^"]*)"([^:])/g, '$1"$2\\n$3"$4')
      // Tek tırnak kullanımını düzelt
      .replace(/'/g, '"')
    
    console.log('=== CLEANED JSON (first 500 chars) ===')
    console.log(cleanedJson.substring(0, 500))
    console.log('=======================================')

    let jsonData
    try {
      jsonData = JSON.parse(cleanedJson)
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===')
      console.error('Error:', parseError)
      console.error('JSON String:', cleanedJson.substring(0, 1000))
      console.error('========================')
      
      // Son çare: Manuel extraction
      console.log('Attempting manual extraction...')
      
      const titleMatch = cleanedJson.match(/"title"\s*:\s*"([^"]+)"/)
      const contentMatch = cleanedJson.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"excerpt"/)
      const excerptMatch = cleanedJson.match(/"excerpt"\s*:\s*"([^"]+)"/)
      
      if (!titleMatch || !contentMatch || !excerptMatch) {
        throw new Error('JSON parse başarısız ve manuel extraction da başarısız')
      }
      
      jsonData = {
        title: titleMatch[1],
        content: contentMatch[1],
        excerpt: excerptMatch[1],
        metaTitle: titleMatch[1],
        metaDescription: excerptMatch[1],
        keywords: [],
        suggestedTags: [],
      }
      
      console.log('Manuel extraction başarılı!')
    }

    // Validate that we have the required fields
    if (!jsonData.title || !jsonData.content) {
      throw new Error('JSON eksik alanlar içeriyor: title veya content yok')
    }

    console.log('=== PARSED DATA ===')
    console.log('Title:', jsonData.title)
    console.log('Content length:', jsonData.content?.length || 0)
    console.log('Excerpt length:', jsonData.excerpt?.length || 0)
    console.log('Content preview:', jsonData.content?.substring(0, 200))
    console.log('===================')

    // Okuma süresini hesapla (ortalama 200 kelime/dakika)
    const wordCount = jsonData.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    const estimatedReadingTime = Math.ceil(wordCount / 200)

    console.log('=== FINAL RESULT ===')
    console.log('Word count:', wordCount)
    console.log('Reading time:', estimatedReadingTime, 'minutes')
    console.log('====================')

    return {
      title: jsonData.title,
      content: jsonData.content,
      excerpt: jsonData.excerpt || jsonData.content.substring(0, 200),
      metaTitle: jsonData.metaTitle || jsonData.title,
      metaDescription: jsonData.metaDescription || jsonData.excerpt || '',
      keywords: Array.isArray(jsonData.keywords) ? jsonData.keywords : [],
      suggestedTags: Array.isArray(jsonData.suggestedTags) ? jsonData.suggestedTags : [],
      estimatedReadingTime,
    }
  } catch (error) {
    console.error('=== FINAL PARSE ERROR ===')
    console.error('Error:', error)
    console.error('Response text (first 2000 chars):', responseText.substring(0, 2000))
    console.error('=========================')
    throw new Error('Gemini yanıtı işlenemedi: ' + (error as Error).message)
  }
}

// Yazıyı geliştir/iyileştir
export async function improveContent(
  content: string,
  instructions: string
): Promise<{ improvedContent: string; usage: AIUsageStats }> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
    },
  })

  const prompt = `Aşağıdaki blog yazısını iyileştir.

**MEVCUT İÇERİK:**
${content}

**İYİLEŞTİRME TALİMATI:**
${instructions}

Lütfen iyileştirilmiş içeriği HTML formatında döndür. Sadece içeriği ver, açıklama yapma.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const promptTokens = estimateTokens(prompt)
    const completionTokens = estimateTokens(text)
    
    const usage: AIUsageStats = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost: calculateCost(promptTokens, completionTokens),
    }

    return {
      improvedContent: text,
      usage,
    }
  } catch (error) {
    console.error('Error improving content:', error)
    throw new Error('İçerik geliştirilemedi: ' + (error as Error).message)
  }
}

// Başlık önerileri
export async function generateTitleSuggestions(
  topic: string,
  count: number = 5
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1000,
    },
  })

  const prompt = `"${topic}" konusu için ${count} farklı ilgi çekici blog başlığı öner.

Her başlık:
- SEO uyumlu olmalı
- 50-60 karakter arası
- İlgi çekici ve tıklanabilir
- Türkçe olmalı

Sadece başlıkları listele, her satırda bir başlık, numaralandırma veya açıklama yapma.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Başlıkları satırlara ayır
    const titles = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .map(line => line.replace(/^[-*•]\s*/, '')) // Liste işaretlerini temizle
      .slice(0, count)

    return titles
  } catch (error) {
    console.error('Error generating titles:', error)
    throw new Error('Başlık önerileri oluşturulamadı')
  }
}

// Trend konuları öner (Bonus!)
export async function generateTopicSuggestions(
  category: string,
  count: number = 5
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 1000,
    },
  })

  const prompt = `"${category}" kategorisi için ${count} farklı güncel ve trend blog yazısı konusu öner.

Her konu:
- Güncel ve ilgi çekici olmalı
- SEO potansiyeli yüksek olmalı
- Hedef kitle için değerli olmalı
- Türkçe olmalı

Sadece konuları listele, her satırda bir konu, açıklama yapma.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const topics = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-*•]\s*/, ''))
      .slice(0, count)

    return topics
  } catch (error) {
    console.error('Error generating topics:', error)
    throw new Error('Konu önerileri oluşturulamadı')
  }
}
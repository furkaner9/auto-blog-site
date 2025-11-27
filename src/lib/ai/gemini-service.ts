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

// Gemini Pro pricing (çok daha ucuz!)
const TOKEN_COSTS = {
  input: 0.00015 / 1000,  // $0.00015 per 1K tokens (128K'ya kadar)
  output: 0.0006 / 1000,  // $0.0006 per 1K tokens
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

  // Gemini Pro modelini başlat
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
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
**UZUNLUK:** Yaklaşık ${wordCount} kelime
**DİL:** ${languageInstructions}

**ÖNEMLİ TALİMATLAR:**

1. **Başlık:** İlgi çekici, SEO uyumlu, 60 karakter civarında
2. **İçerik Yapısı:**
   - Giriş paragrafı (konuyu tanıt)
   - 3-5 ana bölüm (H2 başlıklarıyla)
   - Her bölümde alt başlıklar (H3) kullan
   - Listeler ve örnekler ekle
   - Sonuç paragrafı
3. **HTML Formatı:** Düzgün HTML kullan (h2, h3, p, ul, ol, li, strong, em)
4. **SEO:** Anahtar kelimeleri doğal şekilde yerleştir
5. **Okunabilirlik:** Paragraflar kısa ve anlaşılır olsun

**ÇIKTI FORMATI (JSON):**
Lütfen yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir şey yazma:

\`\`\`json
{
  "title": "Blog yazısının başlığı",
  "content": "<h2>Giriş</h2><p>İçerik buraya...</p>",
  "excerpt": "150-200 kelimelik kısa özet",
  "metaTitle": "SEO için optimize edilmiş başlık (max 60 karakter)",
  "metaDescription": "SEO için meta açıklama (max 160 karakter)",
  "keywords": ["anahtar1", "anahtar2", "anahtar3"],
  "suggestedTags": ["etiket1", "etiket2", "etiket3"]
}
\`\`\`

Şimdi bu kriterlere göre harika bir blog yazısı oluştur!`
}

function parseGeminiResponse(responseText: string): GeneratedBlogPost {
  try {
    // JSON bloğunu bul ve parse et
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
    
    let jsonData
    if (jsonMatch) {
      jsonData = JSON.parse(jsonMatch[1])
    } else {
      // Eğer markdown yok ise direkt parse et
      jsonData = JSON.parse(responseText)
    }

    // Okuma süresini hesapla (ortalama 200 kelime/dakika)
    const wordCount = jsonData.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    const estimatedReadingTime = Math.ceil(wordCount / 200)

    return {
      title: jsonData.title,
      content: jsonData.content,
      excerpt: jsonData.excerpt,
      metaTitle: jsonData.metaTitle,
      metaDescription: jsonData.metaDescription,
      keywords: jsonData.keywords || [],
      suggestedTags: jsonData.suggestedTags || [],
      estimatedReadingTime,
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    console.error('Response text:', responseText)
    throw new Error('Gemini yanıtı işlenemedi')
  }
}

// Yazıyı geliştir/iyileştir
export async function improveContent(
  content: string,
  instructions: string
): Promise<{ improvedContent: string; usage: AIUsageStats }> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
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
    model: 'gemini-pro', // Daha hızlı model
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 500,
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
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 500,
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
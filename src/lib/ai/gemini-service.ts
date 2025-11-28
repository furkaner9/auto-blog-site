import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// --- TİP TANIMLAMALARI ---

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

// --- SABİTLER & AYARLAR ---

// Gemini 2.5 Flash Pricing (Tahmini)
const TOKEN_COSTS = {
  input: 0.075 / 1000000,
  output: 0.30 / 1000000,
}

// GÜNCELLEME: Listeden doğruladığımız model ismini kullanıyoruz
const MODEL_NAME = 'gemini-2.5-flash'

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * TOKEN_COSTS.input) + (outputTokens * TOKEN_COSTS.output)
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// --- ANA FONKSİYONLAR ---

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

  // Gemini Modelini Başlat
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
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

    // Yanıtı işle
    const parsedContent = parseGeminiResponse(text)

    // Token & Maliyet Hesaplama
    const usageMetadata = result.response.usageMetadata
    
    const promptTokens = usageMetadata?.promptTokenCount ?? estimateTokens(prompt)
    const completionTokens = usageMetadata?.candidatesTokenCount ?? estimateTokens(text)
    
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
3. **HTML Formatı:** Düzgün HTML kullan (h2, h3, p, ul, ol, li, strong, em). HTML taglerini string içinde escape etme.
4. **SEO:** Anahtar kelimeleri doğal şekilde yerleştir
5. **Okunabilirlik:** Paragraflar kısa ve anlaşılır olsun

**ÇIKTI FORMATI (JSON):**
Bu JSON şemasını kesinlikle takip et:

{
  "title": "string",
  "content": "string (HTML içeriği)",
  "excerpt": "string (kısa özet)",
  "metaTitle": "string",
  "metaDescription": "string",
  "keywords": ["string"],
  "suggestedTags": ["string"]
}`
}

function parseGeminiResponse(responseText: string): GeneratedBlogPost {
  try {
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const jsonData = JSON.parse(cleanJson)

    const contentText = jsonData.content.replace(/<[^>]*>/g, '')
    const wordCount = contentText.split(/\s+/).filter((w: string) => w.length > 0).length
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
    throw new Error('Gemini yanıtı işlenemedi (JSON Parse Hatası)')
  }
}

export async function improveContent(
  content: string,
  instructions: string
): Promise<{ improvedContent: string; usage: AIUsageStats }> {
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
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

Lütfen iyileştirilmiş içeriği HTML formatında döndür. Sadece içeriği ver, açıklama yapma, markdown bloğu kullanma.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const usageMetadata = result.response.usageMetadata
    const promptTokens = usageMetadata?.promptTokenCount ?? estimateTokens(prompt)
    const completionTokens = usageMetadata?.candidatesTokenCount ?? estimateTokens(text)
    
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

export async function generateTitleSuggestions(
  topic: string,
  count: number = 5
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1000,
      responseMimeType: "application/json"
    },
  })

  const prompt = `"${topic}" konusu için ${count} farklı ilgi çekici blog başlığı öner.
  
  Format: JSON String Array ["Başlık 1", "Başlık 2"]
  
  Kriterler:
  - SEO uyumlu
  - 50-60 karakter arası
  - İlgi çekici
  - Türkçe`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    const titles = JSON.parse(cleanJson);

    if (Array.isArray(titles)) {
        return titles.slice(0, count);
    }
    return [];

  } catch (error) {
    console.error('Error generating titles:', error)
    throw new Error('Başlık önerileri oluşturulamadı')
  }
}

export async function generateTopicSuggestions(
  category: string,
  count: number = 5
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 1000,
      responseMimeType: "application/json"
    },
  })

  const prompt = `"${category}" kategorisi için ${count} farklı güncel blog konusu öner.
  
  Format: JSON String Array ["Konu 1", "Konu 2"]
  
  Kriterler:
  - Güncel ve trend
  - SEO potansiyeli yüksek
  - Türkçe`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    const topics = JSON.parse(cleanJson);

    if (Array.isArray(topics)) {
        return topics.slice(0, count);
    }
    return [];
  } catch (error) {
    console.error('Error generating topics:', error)
    throw new Error('Konu önerileri oluşturulamadı')
  }
}
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API Key bulunamadı (.env dosyasını kontrol et)' }, { status: 500 });
  }

  try {
    // Google API'ye doğrudan sorgu atıyoruz (SDK kullanmadan)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        error: 'Google API Hatası', 
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Sadece "generateContent" özelliğini destekleyen modelleri filtrele
    // ve daha okunaklı bir liste oluştur
    const availableModels = data.models
      ?.filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => ({
        name: m.name, // Örn: models/gemini-1.5-flash
        displayName: m.displayName,
        version: m.version,
        description: m.description
      })) || [];

    return NextResponse.json({
      count: availableModels.length,
      recommended_action: "Aşağıdaki 'name' alanındaki değeri (başındaki 'models/' kısmını atarak) kodunuzda kullanın.",
      models: availableModels,
      raw_data: data // Tam listeyi de görelim
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
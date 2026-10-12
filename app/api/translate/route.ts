import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const targetLang = typeof body?.targetLang === 'string' ? body.targetLang : 'en';

    if (!text) {
      return NextResponse.json({ translatedText: '' });
    }

    if (targetLang === 'fr') {
      return NextResponse.json({ translatedText: text });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY || openAiKey;

    const langName =
      targetLang === 'en' ? 'English' :
      targetLang === 'zh' ? 'Chinese (Simplified)' :
      targetLang === 'ar' ? 'Arabic' : 'English';

    const systemPrompt = `You are a professional translator for the INPTIC university website. Translate the following French text into ${langName}. Preserve formatting, links, and line breaks. Return ONLY the translated text without commentary or quotes.`;

    let apiKey = openAiKey;
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    let model = 'gpt-4o-mini';

    if (openRouterKey) {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = openRouterKey;
      model = 'meta-llama/llama-3.3-70b-instruct';
    }

    if (!apiKey) {
      return NextResponse.json({ translatedText: text });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(openRouterKey ? { 'HTTP-Referer': 'https://inptic-ga.org', 'X-Title': 'INPTIC Translator' } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    const data = await response.json().catch(() => ({}));
    const translatedText = data.choices?.[0]?.message?.content?.trim() || text;

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ translatedText: '' });
  }
}

import { getAIProviderCascadeSettings } from '@/lib/ai-provider-settings';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const SUPPORTED_PROVIDERS = ['groq', 'openai', 'gemini'] as const;

function isAudioFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.type.startsWith('audio/');
}

async function transcribeWithOpenAI(apiKey: string, audio: File) {
  const form = new FormData();
  form.set('file', audio, audio.name || 'question.webm');
  form.set('model', process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe');
  form.set('language', 'fr');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(45_000),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`OpenAI transcription failed (HTTP ${response.status}).`);
  return typeof result?.text === 'string' ? result.text.trim() : '';
}

async function transcribeWithGroq(apiKey: string, audio: File) {
  const form = new FormData();
  form.set('file', audio, audio.name || 'question.webm');
  form.set('model', process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo');
  form.set('language', 'fr');
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(45_000),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Groq transcription failed (HTTP ${response.status}).`);
  return typeof result?.text === 'string' ? result.text.trim() : '';
}

async function transcribeWithGemini(apiKey: string, model: string, audio: File) {
  const audioData = Buffer.from(await audio.arrayBuffer()).toString('base64');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Transcris fidèlement en français les paroles de cet enregistrement. Réponds uniquement avec la transcription.' },
            { inline_data: { mime_type: audio.type, data: audioData } },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(45_000),
      cache: 'no-store',
    },
  );
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Gemini transcription failed (HTTP ${response.status}).`);
  return typeof result?.candidates?.[0]?.content?.parts?.[0]?.text === 'string'
    ? result.candidates[0].content.parts[0].text.trim()
    : '';
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Enregistrement audio invalide.' }, { status: 400 });
  }

  const audio = form.get('audio');
  if (!isAudioFile(audio)) {
    return NextResponse.json({ error: 'Aucun enregistrement audio valide reçu.' }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'L’enregistrement dépasse la limite de 20 Mo.' }, { status: 413 });
  }

  try {
    const providers = await getAIProviderCascadeSettings();
    const transcribers = providers.filter((provider) =>
      SUPPORTED_PROVIDERS.includes(provider.provider as (typeof SUPPORTED_PROVIDERS)[number]),
    );
    if (!transcribers.length) {
      return NextResponse.json(
        { error: 'Aucun service de transcription configuré. Ajoutez une clé Groq, OpenAI ou Gemini dans les paramètres IA.' },
        { status: 503 },
      );
    }

    for (const provider of transcribers) {
      try {
        const text = provider.provider === 'groq'
          ? await transcribeWithGroq(provider.apiKey, audio)
          : provider.provider === 'openai'
            ? await transcribeWithOpenAI(provider.apiKey, audio)
            : await transcribeWithGemini(provider.apiKey, provider.model, audio);
        if (!text) throw new Error('Empty transcription.');
        return NextResponse.json({ text });
      } catch (error) {
        console.warn(`[Sohane] Transcription échouée avec ${provider.provider}; tentative du fournisseur suivant.`,
          error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return NextResponse.json(
      { error: 'La transcription vocale a échoué avec les fournisseurs configurés. Vérifiez leurs clés, modèles et quotas.' },
      { status: 502 },
    );
  } catch (error) {
    console.error('[Sohane] Impossible de préparer la transcription vocale:', error);
    return NextResponse.json({ error: 'Les services de transcription sont momentanément indisponibles.' }, { status: 503 });
  }
}

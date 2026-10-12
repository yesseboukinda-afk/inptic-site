import { NextResponse } from 'next/server';

function readObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : undefined;
}

function readAudioData(value: unknown) {
  const steps = readObject(value)?.steps;
  if (!Array.isArray(steps)) return undefined;

  for (const step of [...steps].reverse()) {
    const stepObject = readObject(step);
    if (stepObject?.type !== 'model_output' || !Array.isArray(stepObject.content)) continue;

    for (const content of [...stepObject.content].reverse()) {
      const contentObject = readObject(content);
      if (contentObject?.type === 'audio' && typeof contentObject.data === 'string') {
        return contentObject.data;
      }
    }
  }

  return undefined;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'La requête audio est invalide.' }, { status: 400 });
  }

  const text = readObject(body)?.text;
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Aucun texte à lire.' }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: 'Le texte à lire dépasse la limite autorisée.' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'La voix Gemini n’est pas configurée. Ajoutez GEMINI_API_KEY aux variables serveur.' },
      { status: 503 },
    );
  }

  const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model,
        input: [{
          type: 'user_input',
          content: [{
            type: 'text',
            text: text.trim(),
            annotations: [{
              type: 'speech_metadata',
              style: 'Speak in French with a soft, feminine, warm, natural human voice. Sound like a kind and reassuring woman speaking conversationally to one person, with gentle breaths, subtle human intonation, clear pronunciation, and a calm unhurried pace. Keep the delivery tender and approachable, never robotic, theatrical, breathy, or overly bright. Read the text faithfully without adding words.',
            }],
          }],
        }],
        response_format: { type: 'audio' },
        generation_config: {
          speech_config: [{ voice: 'Achernar' }],
        },
      }),
    });

    const data: unknown = await response.json();
    if (!response.ok) {
      const apiError = readObject(readObject(data)?.error)?.message;
      return NextResponse.json(
        {
          error: `Gemini TTS n’a pas pu générer la voix (HTTP ${response.status}). ${
            typeof apiError === 'string' ? apiError : 'Vérifiez le modèle TTS, la clé Gemini et le quota.'
          }`,
        },
        { status: 502 },
      );
    }

    const audioBase64 = readAudioData(data);
    if (!audioBase64) {
      return NextResponse.json({ error: 'Gemini TTS n’a renvoyé aucun audio.' }, { status: 502 });
    }

    const audioBytes = Buffer.from(audioBase64, 'base64');
    if (!audioBytes.length) {
      return NextResponse.json({ error: 'Le fichier audio renvoyé par Gemini est vide.' }, { status: 502 });
    }

    return new Response(new Uint8Array(audioBytes), {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'Content-Length': String(audioBytes.length),
      },
    });
  } catch (error) {
    console.error('Gemini TTS request failed:', error);
    const cause = error instanceof Error && typeof error.cause === 'object' && error.cause !== null
      ? error.cause as { code?: unknown }
      : undefined;
    const networkCode = typeof cause?.code === 'string' ? cause.code : '';
    if (networkCode === 'ETIMEDOUT' || (error instanceof Error && error.name === 'TimeoutError')) {
      return NextResponse.json(
        { error: 'Le serveur n’arrive pas à joindre Google Gemini TTS (délai réseau dépassé).' },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: `Impossible de joindre le service vocal Gemini${networkCode ? ` (${networkCode})` : ''}. Vérifiez l’accès réseau sortant du serveur et réessayez.` },
      { status: 502 },
    );
  }
}

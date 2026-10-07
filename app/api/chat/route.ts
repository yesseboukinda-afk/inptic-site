import { NextRequest, NextResponse } from 'next/server';
import {
  chatExists,
  createChat,
  saveChatMessage,
} from '@/lib/chatbot-db';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type GroundingSource = {
  uri: string;
  title?: string;
};

function readObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : undefined;
}

function extractGroundingSources(value: unknown): GroundingSource[] {
  if (!Array.isArray(value)) return [];

  const sources = value.flatMap((chunk): GroundingSource[] => {
    const web = readObject(readObject(chunk)?.web);
    if (typeof web?.uri !== 'string') return [];

    try {
      const uri = new URL(web.uri);
      if (uri.protocol !== 'https:') return [];
      return [{
        uri: uri.href,
        ...(typeof web.title === 'string' ? { title: web.title } : {}),
      }];
    } catch {
      return [];
    }
  });

  return sources.filter((source, index) =>
    sources.findIndex((candidate) => candidate.uri === source.uri) === index,
  ).slice(0, 5);
}

const siteKnowledge = `
INPTIC signifie Institut National de la Poste, des Technologies de l'Information et de la Communication au Gabon.
Le site présente notamment les formations en cybersécurité, génie logiciel, monétique,
télécommunications et postes/logistique, ainsi que les rubriques admissions, vie étudiante,
recherche, entreprises, institut et contact.
Processus d'admission et d'inscription :
1. Dépôt de dossier en ligne avec pièces justificatives (CNI, Bac, Relevés) sur /admissions/depot.
2. Envoi immédiat en temps réel d'un e-mail d'accusé de réception certifiant l'éligibilité.
3. Règlement sécurisé des frais de dossier de 20 000 FCFA via Mobile Money (Airtel Money ou Moov Money) avec sélection de l'opérateur et numéro à débiter.
4. Génération d'une Quittance officielle de paiement dotée d'un QR code d'authenticité vérifiable en temps réel sur /quittance/[reference].
5. Suivi de la validation du dossier par la Direction de la Scolarité sur /admissions/suivi.
`;

// Providers de repli si Gemini n'est pas configuré.
const MODEL_CASCADE = [
  { name: 'OpenAI GPT-4o-mini', model: 'gpt-4o-mini', provider: 'openai' },
  { name: 'Meta Llama 3.3 70B (Open Source)', model: 'meta-llama/llama-3.3-70b-instruct', provider: 'openrouter' },
  { name: 'DeepSeek Chat', model: 'deepseek/deepseek-chat', provider: 'openrouter' },
  { name: 'Mistral Mixtral 8x7B (Open Source)', model: 'mistralai/mixtral-8x7b-instruct', provider: 'openrouter' },
  { name: 'Google Gemini 2.0 Flash', model: 'google/gemini-2.0-flash-exp:free', provider: 'openrouter' },
  { name: 'Qwen 2.5 72B (Open Source)', model: 'qwen/qwen-2.5-72b-instruct', provider: 'openrouter' },
  { name: 'Anthropic Claude 3.5 Sonnet', model: 'anthropic/claude-3.5-sonnet', provider: 'openrouter' },
  { name: 'Microsoft Phi-4 (Open Source)', model: 'microsoft/phi-4', provider: 'openrouter' },
  { name: 'Cohere Command R+', model: 'cohere/command-r-plus', provider: 'openrouter' },
  { name: 'OpenAI GPT-4o', model: 'gpt-4o', provider: 'openai' },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessages: unknown = body?.messages;
    const messages: ChatMessage[] = Array.isArray(rawMessages)
      ? rawMessages
          .filter(
            (item): item is ChatMessage =>
              item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string',
          )
          .map((item) => ({
            role: item.role,
            content: item.content.trim().slice(0, 2000),
          }))
          .filter((item) => item.content)
          .slice(-12)
      : [];

    if (!messages.length || !messages.some((item) => item.role === 'user')) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 });
    }

    const text = messages.filter((item) => item.role === 'user').at(-1)?.content || '';

    const systemPrompt = `Tu es l'assistant vocal et textuel officiel de l'INPTIC (Institut National de la Poste, des Technologies de l'Information et de la Communication au Gabon).
Tu es doté d'une intelligence artificielle avancée capable de répondre à n'importe quelle question (questions générales, scientifiques, météo, culture, comparaisons et équivalences de diplômes comme le Bac B ou autres séries au Gabon par rapport à l'international, etc.) et d'expliquer avec une précision absolue les processus d'inscription et d'admission de l'INPTIC.

Directives clés :
1. Équivalences & Culture générale : Réponds avec expertise aux questions d'équivalence de diplômes (ex: le Baccalauréat B au Gabon - axé sur l'économie et les sciences sociales - équivaut historiquement au Bac ES en France ou aux séries tertiaires/économiques internationales).
2. Processus d'admission et d'inscription INPTIC : Explique clairement les étapes :
   - Dépôt de dossier en ligne avec téléversement des pièces justificatives (CNI, Bac, Relevés) sur [/admissions/depot](/admissions/depot).
   - Envoi immédiat en temps réel d'un e-mail d'accusé de réception certifiant l'éligibilité.
   - Règlement sécurisé des frais de dossier de 20 000 FCFA via Mobile Money (Airtel Money ou Moov Money) avec sélection de l'opérateur et numéro à débiter.
   - Génération d'une Quittance officielle de paiement dotée d'un QR code d'authenticité vérifiable en temps réel sur [/quittance/[reference]](/quittance/[reference]).
   - Suivi de la validation du dossier par la Direction de la Scolarité sur [/admissions/suivi](/admissions/suivi).
3. Raisonnement : Analyse la question avec soin, vérifie les étapes et les faits avant de répondre. Ne révèle pas ton raisonnement interne détaillé ; donne uniquement une conclusion et des explications utiles à l'utilisateur.
4. Calculs : Pour les calculs complexes ou nécessitant plusieurs étapes, utilise l'exécution de code Python et vérifie le résultat avant de l'expliquer.
5. Recherche : Pour les informations récentes, vérifiables ou susceptibles d'avoir changé, utilise Google Search et cite les sources consultées dans la réponse.
6. Style de réponse : Clair, structuré, chaleureux, idéal pour la lecture vocale (synthèse vocale) et textuelle. Utilise les liens internes Markdown pertinents fournis dans le contexte.

Contexte du site :\n${siteKnowledge}`;

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
    const openAiKey = process.env.OPENAI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!geminiApiKey && !openAiKey && !openRouterKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucune clé IA configurée. Ajoutez GEMINI_API_KEY dans les variables d’environnement serveur.',
        },
        { status: 500 }
      );
    }

    const requestedChatId = typeof body?.chatId === 'string' ? body.chatId : '';
    const chat = requestedChatId && chatExists(requestedChatId) ? { id: requestedChatId } : createChat(text);
    saveChatMessage(chat.id, 'user', text);

    if (geminiApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: messages.map((message) => ({
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
            tools: [
              { google_search: {} },
              { code_execution: {} },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 12288,
              thinkingConfig: {
                thinkingBudget: 8192,
              },
            },
          }),
        },
      );
      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: unknown }) => typeof part.text === 'string' ? part.text : '')
        .join('')
        .trim();
      const sources = extractGroundingSources(data?.candidates?.[0]?.groundingMetadata?.groundingChunks);

      if (!response.ok) {
        const apiError = typeof data?.error?.message === 'string' ? data.error.message : '';
        return NextResponse.json(
          {
            success: false,
            error: `Gemini n’a pas pu répondre (HTTP ${response.status}). ${apiError || 'Vérifiez la clé GEMINI_API_KEY, le modèle et le quota Google AI.'}`,
          },
          { status: 502 },
        );
      }

      if (!reply) {
        return NextResponse.json(
          { success: false, error: 'Gemini a renvoyé une réponse vide. Reformulez votre question.' },
          { status: 502 },
        );
      }

      const replyWithSources = sources.length
        ? `${reply}\n\nSources consultées :\n${sources.map((source: { uri: string; title?: string }) =>
            `- [${source.title || source.uri}](${source.uri})`,
          ).join('\n')}`
        : reply;

      saveChatMessage(chat.id, 'assistant', replyWithSources);
      return NextResponse.json({ chatId: chat.id, documents: [], reply: replyWithSources, usedModel: `Google ${geminiModel}` });
    }

    let lastError = '';

    // Legacy provider fallback for installations without a Gemini API key.
    for (const item of MODEL_CASCADE) {
      try {
        let endpoint = 'https://api.openai.com/v1/chat/completions';
        let apiKey = openAiKey;

        if (item.provider === 'openrouter') {
          endpoint = 'https://openrouter.ai/api/v1/chat/completions';
          apiKey = openRouterKey;
        }

        if (!apiKey) continue;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...(item.provider === 'openrouter' ? { 'HTTP-Referer': 'https://inptic.ga', 'X-Title': 'INPTIC Assistant' } : {}),
          },
          body: JSON.stringify({
            model: item.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            temperature: 0.4,
            max_tokens: 450,
          }),
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          const reply = data.choices[0].message.content.trim();
          saveChatMessage(chat.id, 'assistant', reply);
          return NextResponse.json({ chatId: chat.id, documents: [], reply, usedModel: item.name });
        } else {
          lastError = data?.error?.message || `Erreur HTTP ${response.status} avec le modèle ${item.name}`;
        }
      } catch (err: any) {
        lastError = err?.message || `Échec du modèle ${item.name}`;
      }
    }

    if (!geminiApiKey) {
      throw new Error(
        `GEMINI_API_KEY n’est pas configurée et les fournisseurs IA de secours sont injoignables (${lastError || 'aucune réponse'}). Ajoutez GEMINI_API_KEY aux variables serveur pour activer Gemini.`,
      );
    }

    throw new Error(`Tous les modèles de la cascade ont échoué. Dernier échec : ${lastError}`);
  } catch (error) {
    console.error('Chat API cascade error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne de la cascade de modèles IA.',
      },
      { status: 500 }
    );
  }
}

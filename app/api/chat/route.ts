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

// Cascade de 10 modèles IA (combinant modèles commerciaux et open source de pointe)
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
    const requestedChatId = typeof body?.chatId === 'string' ? body.chatId : '';
    const chat = requestedChatId && chatExists(requestedChatId) ? { id: requestedChatId } : createChat(text);
    saveChatMessage(chat.id, 'user', text);

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
3. Style de réponse : Clair, structuré, chaleureux, idéal pour la lecture vocale (synthèse vocale) et textuelle. Utilise les liens internes Markdown pertinents fournis dans le contexte.

Contexte du site :\n${siteKnowledge}`;

    const openAiKey = process.env.OPENAI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY || openAiKey;

    if (!openAiKey && !openRouterKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Clé API introuvable. Avez-vous bien redémarré votre serveur Next.js après avoir ajouté OPENROUTER_API_KEY dans votre fichier .env.local ? (Arrêtez le serveur avec Ctrl+C puis relancez npm run dev).',
        },
        { status: 500 }
      );
    }

    let lastError = '';

    // Test de la cascade de 10 modèles en séquence
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

import { NextRequest, NextResponse } from 'next/server';
import { generateText, gateway, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import {
  chatExists,
  createChat,
  getChatMessages,
  getDocument,
  saveChatMessage,
  saveDocument,
  type DocumentKind,
} from '@/lib/chatbot-db';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const siteKnowledge = `
INPTIC signifie Institut National de la Poste, des Technologies de l'Information et de la Communication.
Le site présente notamment les formations en cybersécurité, génie logiciel, monétique,
télécommunications et postes/logistique, ainsi que les rubriques admissions, vie étudiante,
recherche, entreprises, institut et contact.
La filière Télécommunications est centrée sur les réseaux, les systèmes embarqués, l'Internet
des objets (IoT) et les services numériques. Elle aborde la conception, l'administration et la
sécurisation des infrastructures réseau, ainsi que la création de systèmes connectés.
La filière Cybersécurité prépare à protéger les systèmes, les données et les infrastructures
numériques. Elle couvre la sécurité réseau, l'analyse des vulnérabilités, la correction des
failles, la gestion des risques et la prévention des incidents.
La filière Génie logiciel apprend à concevoir, développer et maintenir des logiciels fiables
et évolutifs. Elle couvre l'architecture logicielle, les interfaces, les API, les services
applicatifs, les tests, la sécurité et la maintenance.
La filière Monétique porte sur les systèmes de paiement électronique, la sécurité des
transactions, la protection des données bancaires et la gestion numérique des flux monétaires.
La filière Postes et Logistique porte sur la gestion des opérations, la chaîne logistique,
la planification, le suivi des flux matériels et informationnels et l'amélioration de la
performance des processus de production et de distribution.
Management des TIC regroupe le marketing digital, le commerce TIC, l'e-commerce, le CRM,
la transformation numérique et la gestion de projets IT. Ses débouchés incluent chargé de
marketing digital, chef de projet digital, commercial TIC, gestionnaire e-commerce et CRM,
analyste business et consultant en innovation digitale.
Audiovisuel regroupe les parcours Son, Image, Montage, Réalisation, Production et Script.
La filière développe les compétences de création audiovisuelle, prise de vue, audio, montage
et production. Les débouchés incluent monteur vidéo, cadreur, technicien son, assistant
réalisateur, réalisateur junior, producteur audiovisuel et gestionnaire de contenu multimédia.
Les formations qualifiantes comprennent IoT et réseaux de capteurs, cybersécurité et
infrastructures télécoms, usage des TIC, infographie et montage vidéo, marketing numérique,
cybersécurité, intelligence artificielle, développement web et journaliste reporter d'images.
Les certifications comprennent intelligence artificielle, IoT, Big Data, cybersécurité et
Cloud Computing.
Pour une information précise (dates, frais, pièces, coordonnées ou résultats), indique que
la page officielle Admissions ou Contact fait foi et ne fabrique jamais de valeur.
Les pages utiles sont /formations, /admissions, /admissions/depot, /admissions/suivi,
/vie-etudiante et /contact.
`;

const weatherTool = tool({
  description: 'Get the current weather for a city when the user asks about weather.',
  inputSchema: z.object({
    city: z.string().describe('The city name, for example Libreville or Paris'),
  }),
  execute: async ({ city }) => {
    const geocodingResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`,
    );
    const geocodingData = await geocodingResponse.json();
    const location = geocodingData.results?.[0];

    if (!location) return { error: `Ville introuvable : ${city}` };

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`,
    );
    const weatherData = await weatherResponse.json();

    return {
      city: location.name,
      country: location.country,
      current: weatherData.current,
    };
  },
});

const documentKindSchema = z.enum(['text', 'code', 'sheet']);

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildFallbackReply(message: string): string {
  const text = normalize(message);

  if (/^(bonjour|bonsoir|salut|coucou|hello|hey)([ !,.?]|$)/.test(text)) {
    return 'Bonjour et bienvenue à l’INPTIC !\n\nJe peux vous renseigner sur les formations, l’inscription, le dépôt et le suivi de dossier, la vie étudiante ou les contacts.\n\nQue souhaitez-vous savoir ?';
  }

  if (/^(merci|merci beaucoup|je vous remercie)([ !,.?]|$)/.test(text)) {
    return 'Avec plaisir ! Je reste disponible pour vous aider avec votre inscription, une formation ou toute autre information sur l’INPTIC.';
  }

  if (/^(au revoir|a bientot|bonne journee|bonne soiree)([ !,.?]|$)/.test(text)) {
    return 'Au revoir et bonne journée ! N’hésitez pas à revenir si vous avez une question sur l’INPTIC.';
  }

  if (/management des tic|marketing digital|marketing numerique|e-commerce|commerce tic|transformation numerique/.test(text)) {
    return '## Management des TIC\n\nCette filière prépare à accompagner les organisations dans leur développement commercial et leur transformation numérique. Elle aborde le marketing digital, l’e-commerce, le CRM, le commerce TIC et la gestion de projets IT.\n\n## Débouchés\n\n- Chargé de marketing digital\n- Chef de projet digital\n- Commercial TIC ou conseiller en transformation numérique\n- Gestionnaire e-commerce et CRM\n- Analyste business ou consultant en innovation digitale\n\nConsultez [les formations](/formations) pour voir les parcours proposés.';
  }

  if (/audiovisuel|montage video|infographie|journaliste reporter|jri|realisation|production|script|image|son/.test(text)) {
    return '## Audiovisuel\n\nLa filière couvre le son, l’image, le montage, la réalisation, la production et le script. Elle développe les compétences de prise de vue, création audio, montage et production de contenus multimédias.\n\n## Débouchés\n\n- Monteur vidéo\n- Cadreur ou chef opérateur\n- Technicien du son\n- Assistant réalisateur ou réalisateur junior\n- Producteur audiovisuel\n- Journaliste reporter d’images ou gestionnaire de contenu multimédia\n\nDécouvrez [les formations de l’INPTIC](/formations).';
  }

  if (/genie logiciel|developpement logiciel|architecture logicielle|developpement web|application/.test(text)) {
    return '## Génie logiciel\n\nCette filière apprend à concevoir, développer et maintenir des logiciels fiables et évolutifs. Elle aborde l’architecture applicative, les interfaces, les API, les services, les tests, la sécurité et la maintenance.\n\n## Débouchés\n\n- Développeur web ou d’applications\n- Développeur backend, frontend ou full stack junior\n- Concepteur logiciel\n- Intégrateur web\n- Testeur ou responsable qualité logicielle\n\nConsultez [la filière Génie logiciel](/formations/genie-logiciel).';
  }

  if (/cybersecurite|securite informatique|pentest|hacker ethique|vulnerabilite|gestion des risques/.test(text)) {
    return '## Cybersécurité\n\nLa filière forme à protéger les systèmes, les données et les infrastructures numériques. Elle couvre la sécurité réseau, l’analyse des vulnérabilités, la correction des failles, la gestion des risques et la prévention des incidents.\n\n## Débouchés\n\n- Analyste en sécurité informatique\n- Analyste cybersécurité\n- Administrateur sécurité réseau\n- Technicien sécurité des systèmes d’information\n- Pentester junior ou spécialiste conformité sécurité\n\nDécouvrez [la filière Cybersécurité](/formations/cybersecurite).';
  }

  if (/monetique|paiement electronique|transaction|flux monetaire|donnees bancaires/.test(text)) {
    return '## Monétique\n\nCette filière est spécialisée dans les systèmes de paiement électronique et les flux monétaires numériques. Elle couvre la mise en place des moyens de paiement, la sécurité des transactions, la protection des données bancaires et l’optimisation des processus transactionnels.\n\n## Débouchés\n\n- Technicien ou intégrateur de solutions de paiement\n- Analyste sécurité des transactions\n- Chargé de support monétique\n- Assistant chef de projet moyens de paiement\n- Gestionnaire de flux transactionnels\n\nDécouvrez [la filière Monétique](/formations/monetique).';
  }

  if (/postes? et logistique|logistique|chaine logistique|flux materiels|planification|performance operationnelle/.test(text)) {
    return '## Postes & Logistique\n\nCette filière forme à gérer les opérations, la chaîne logistique et les processus de production et de distribution. Elle aborde l’organisation des flux matériels et informationnels, la planification, le suivi des activités et l’amélioration continue de la performance.\n\n## Débouchés\n\n- Assistant ou responsable logistique\n- Gestionnaire des stocks et des flux\n- Planificateur des opérations\n- Coordinateur transport et distribution\n- Assistant supply chain ou analyste de performance\n\nDécouvrez [la filière Postes & Logistique](/formations/postes-logistique).';
  }

  if (/reseaux et systemes numeriques|administration de systemes|bases de donnees|applications reparties/.test(text)) {
    return '## Réseaux et Systèmes Numériques\n\nCe domaine regroupe le développement d’applications réparties, l’administration des systèmes et des bases de données, les réseaux et télécommunications ainsi que la sécurité des réseaux. Il prépare à concevoir, administrer et protéger les infrastructures et les services numériques.\n\n## Débouchés\n\n- Administrateur systèmes et réseaux\n- Administrateur de bases de données\n- Spécialiste support infrastructure numérique\n- Consultant réseau et cybersécurité\n- Développeur d’applications réparties\n\nConsultez [toutes les formations](/formations) pour voir les parcours de ce domaine.';
  }

  if (/intelligence artificielle|machine learning|big data|cloud computing/.test(text)) {
    return '## Formations spécialisées\n\nL’INPTIC propose des parcours et certifications en intelligence artificielle, Big Data et Cloud Computing. Ils portent respectivement sur l’analyse de données et l’automatisation, l’exploitation des données massives, ainsi que la migration, l’administration et la sécurisation des services cloud.\n\n## Débouchés\n\n- Data analyst ou data engineer junior\n- Spécialiste IA ou machine learning\n- Administrateur cloud\n- Technicien infrastructure cloud\n- Analyste de données ou consultant migration cloud\n\nConsultez [la page des formations](/formations) pour connaître les parcours disponibles.';
  }

  if (/filiere reseau|filiere telecom|telecommunication|reseaux?|infrastructure reseau|iot|systemes embarques?/.test(text)) {
    return '## Filière Télécommunications\n\nCette filière forme aux technologies des réseaux et des services numériques. Elle couvre notamment :\n- la conception et l’administration des infrastructures réseau ;\n- la sécurisation des réseaux et des systèmes ;\n- les systèmes embarqués et l’Internet des objets (IoT) ;\n- la mise en place de services numériques pour les organisations.\n\n## Débouchés possibles\n\nSelon ses compétences et son expérience, un diplômé peut viser des postes comme administrateur réseau, technicien réseaux et télécoms, ingénieur réseaux, spécialiste sécurité réseau ou intégrateur de solutions IoT et systèmes connectés.\n\nPour découvrir la présentation officielle : [Filière Télécommunications](/formations/telecoms).';
  }

  if (/formation|filiere|programme|diplome|metier|carriere/.test(text)) {
    return 'Voici les principaux parcours proposés par l’INPTIC :\n- Cybersécurité\n- Génie logiciel\n- Monétique\n- Télécommunications\n- Postes et logistique\n\nConsultez [toutes les formations](/formations) pour comparer les parcours et les conditions d’accès.';
  }

  if (/admission|inscription|concours|candidature|dossier|depot|suivi/.test(text)) {
    return 'Pour une inscription, suivez ces étapes :\n1. Consultez les conditions d’admission.\n2. Préparez les pièces demandées.\n3. Déposez votre candidature en ligne.\n4. Suivez l’avancement de votre dossier.\n\nLiens utiles : [guide des admissions](/admissions/guide), [déposer un dossier](/admissions/depot) et [suivre un dossier](/admissions/suivi).';
  }

  if (/prix|cout|frais|tarif|scolarite|paiement/.test(text)) {
    return 'Les frais dépendent de la formation et de la procédure d’admission. Je préfère ne pas inventer de montant : consultez la page [Admissions](/admissions) ou [Contact](/contact) pour obtenir l’information officielle.';
  }

  if (/contact|adresse|telephone|email|localisation|bureau|lieu/.test(text)) {
    return 'Les coordonnées officielles, l’adresse et les moyens de contact sont regroupés sur la page [Contact](/contact). C’est la meilleure source pour éviter une information obsolète.';
  }

  if (/vie etudiante|campus|logement|bourse|club|association|evenement/.test(text)) {
    return 'La vie étudiante comprend les activités académiques, l’encadrement, les événements et les services proposés aux étudiants. Découvrez la page [Vie étudiante](/vie-etudiante) pour plus d’informations.';
  }

  if (/cyber|securite|logiciel|telecom|monetique|logistique/.test(text)) {
    return 'Les formations de l’INPTIC couvrent notamment la cybersécurité, le génie logiciel, les télécommunications, la monétique et la logistique. Consultez [les formations](/formations) pour choisir un parcours.';
  }

  if (/qui|qu'est-ce|definition|inptic|institut/.test(text)) {
    return 'L’INPTIC est l’Institut National de la Poste, des Technologies de l’Information et de la Communication. Découvrez [la présentation de l’institut](/institut/presentation) et les informations générales sur [l’INPTIC](/institut).';
  }

  if (/dossier|document|piece|pièce|cv|lettre|certificat/.test(text)) {
    return 'Les pièces demandées dépendent de la formation et de la procédure. Préparez votre dossier avec attention, puis consultez le [guide des admissions](/admissions/guide) avant de [déposer votre candidature](/admissions/depot).';
  }

  if (/directeur|dg|admin|validation|accepter|refuser/.test(text)) {
    return 'L’administration vérifie le profil et les documents avant de mettre à jour l’état du dossier. Consultez la page [Suivi de candidature](/admissions/suivi) pour voir les notifications disponibles.';
  }

  return 'Je peux vous aider sur :\n- les formations : [voir les formations](/formations)\n- l’inscription : [voir les admissions](/admissions)\n- le dépôt et le suivi de dossier\n- la vie étudiante\n- les contacts : [ouvrir la page Contact](/contact)\n\nQuelle information recherchez-vous ?';
}

function buildLocalArtifact(message: string) {
  const creationMatch = message.match(
    /(?:cr(?:ée|eer|e)\s+(?:un|une)\s+)?(?:document|fichier|code|tableau)\s+(?:intitul[ée]|nomm[ée]|appel[ée])\s*[«"']?([^«"'\n]+)[»"']?/i,
  );

  if (!creationMatch || !/cr(?:ée|eer|e)|g[ée]n[èe]re|r[ée]dige|produis/i.test(message)) {
    return null;
  }

  const normalized = normalize(message);
  const kind: DocumentKind = /code|fichier/.test(normalized) ? 'code' : /tableau|feuille|csv/.test(normalized) ? 'sheet' : 'text';
  const title = creationMatch[1]
    .replace(/\s+(?:avec|contenant|qui contient)\s+.*/i, '')
    .trim()
    .replace(/[»"']+$/, '') || 'Document INPTIC';
  const content = kind === 'code'
    ? '// Document créé par INPTIC Assistant\n\n'
    : kind === 'sheet'
      ? 'Titre,Description\nINPTIC,Institut National de la Poste des Technologies de l’Information et de la Communication\n'
      : `# ${title}\n\nL’INPTIC est l’Institut National de la Poste, des Technologies de l’Information et de la Communication.\n\nCet institut accompagne les étudiants dans les domaines du numérique, des télécommunications, de la cybersécurité, du génie logiciel, de la monétique et de la logistique.\n`;

  return saveDocument({ title, kind, content });
}

export async function POST(req: NextRequest) {
  let requestText = '';
  let requestChatId = '';

  try {
    const body = await req.json();
    const rawMessages: unknown = body?.messages;
    const legacyMessage = typeof body?.message === 'string' ? body.message : '';
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
      : legacyMessage.trim()
        ? [{ role: 'user', content: legacyMessage.trim().slice(0, 2000) }]
        : [];

    if (!messages.length || !messages.some((item) => item.role === 'user')) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 });
    }

    const text = messages.filter((item) => item.role === 'user').at(-1)?.content || '';
    const requestedChatId = typeof body?.chatId === 'string' ? body.chatId : '';
    const chat = requestedChatId && chatExists(requestedChatId) ? { id: requestedChatId } : createChat(text);
    requestText = text;
    requestChatId = chat.id;
    saveChatMessage(chat.id, 'user', text);
    const systemPrompt = `Tu es l'assistant officiel de l'INPTIC. Tiens une conversation naturelle et cohérente en français. Adapte ta réponse à l'intention : réponds chaleureusement à une salutation, remercie en retour, et termine poliment si l'utilisateur dit au revoir. Pour une demande d'information, réponds avec une structure lisible : un court titre, une explication directe, puis des étapes ou des puces si nécessaire. Termine par un lien Markdown vers la page utile, par exemple [Déposer un dossier](/admissions/depot). Les liens doivent utiliser uniquement les chemins internes fournis dans le contexte. Utilise l'historique pour comprendre les relances et ne répète pas inutilement les informations déjà données. Pose une question courte si la demande est ambiguë et propose la prochaine action utile. Ne prétends jamais connaître une date, un tarif, une adresse ou une condition qui n'est pas fournie. Pour ces informations, oriente vers la page officielle correspondante ou Contact. Ne parle pas de ton fonctionnement interne.\n\nContexte du site :\n${siteKnowledge}`;
    const gatewayKey = process.env.AI_GATEWAY_API_KEY;
    const apiKey = process.env.OPENAI_API_KEY;

    if (gatewayKey) {
      const result = await generateText({
        model: gateway.languageModel('moonshotai/kimi-k2.5'),
        system: `${systemPrompt}\n\nTu peux utiliser l’outil météo uniquement lorsque la question porte réellement sur la météo. Tu peux créer ou modifier un artefact uniquement si l'utilisateur demande explicitement un document, du code ou un tableau. Pour un artefact, explique brièvement ce qui a été créé ou modifié après l'appel de l'outil.`,
        messages,
        tools: {
          getWeather: weatherTool,
          createDocument: tool({
            description: 'Create a persistent text document, code file, or spreadsheet when explicitly requested.',
            inputSchema: z.object({
              title: z.string(),
              kind: documentKindSchema,
              content: z.string().describe('The complete content to save in the artifact'),
            }),
            execute: async ({ title, kind, content }) => saveDocument({ title, kind, content }),
          }),
          editDocument: tool({
            description: 'Edit an existing artifact by exact string replacement.',
            inputSchema: z.object({
              id: z.string(),
              oldString: z.string(),
              newString: z.string(),
              replaceAll: z.boolean().optional(),
            }),
            execute: async ({ id, oldString, newString, replaceAll }) => {
              const document = getDocument(id);
              if (!document) return { error: 'Document introuvable' };
              if (!document.content.includes(oldString)) return { error: 'Texte à remplacer introuvable' };
              const content = replaceAll ? document.content.replaceAll(oldString, newString) : document.content.replace(oldString, newString);
              return saveDocument({ id, title: document.title, kind: document.kind, content });
            },
          }),
          updateDocument: tool({
            description: 'Replace the complete content of an existing artifact when a major rewrite is requested.',
            inputSchema: z.object({
              id: z.string(),
              content: z.string(),
            }),
            execute: async ({ id, content }) => {
              const document = getDocument(id);
              if (!document) return { error: 'Document introuvable' };
              return saveDocument({ id, title: document.title, kind: document.kind, content });
            },
          }),
        },
        stopWhen: stepCountIs(3),
        temperature: 0.4,
        maxOutputTokens: 450,
      });

      const documents = result.steps
        .flatMap((step) => step.toolResults)
        .map((toolResult) => toolResult.output)
        .filter((output): output is ReturnType<typeof saveDocument> => Boolean(output && typeof output === 'object' && 'id' in output && 'content' in output));
      const reply = result.text.trim() || buildFallbackReply(text);
      saveChatMessage(chat.id, 'assistant', reply);
      return NextResponse.json({ chatId: chat.id, documents, reply });
    }

    if (!apiKey) {
      const localDocument = buildLocalArtifact(text);
      const reply = localDocument
        ? `J’ai créé l’artefact « ${localDocument.title} ». Vous pouvez maintenant consulter et modifier son contenu dans le panneau Artefacts.`
        : buildFallbackReply(text);
      saveChatMessage(chat.id, 'assistant', reply);
      return NextResponse.json({ chatId: chat.id, documents: localDocument ? [localDocument] : [], reply });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages,
        ],
        temperature: 0.4,
        max_tokens: 450,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      const localDocument = buildLocalArtifact(text);
      const reply = localDocument
        ? `J’ai créé l’artefact « ${localDocument.title} ». Vous pouvez maintenant consulter et modifier son contenu dans le panneau Artefacts.`
        : buildFallbackReply(text);
      saveChatMessage(chat.id, 'assistant', reply);
      return NextResponse.json({ chatId: chat.id, documents: localDocument ? [localDocument] : [], reply });
    }

    const reply =
      data.choices?.[0]?.message?.content?.trim() || buildFallbackReply(text);

    saveChatMessage(chat.id, 'assistant', reply);
    return NextResponse.json({ chatId: chat.id, documents: [], reply });
  } catch (error) {
    console.error('OpenAI error:', error);
    const localDocument = buildLocalArtifact(requestText);
    const fallback = localDocument
      ? `J’ai créé l’artefact « ${localDocument.title} ». Vous pouvez maintenant consulter et modifier son contenu dans le panneau Artefacts.`
      : buildFallbackReply(requestText);
    if (requestChatId) saveChatMessage(requestChatId, 'assistant', fallback);
    return NextResponse.json({ chatId: requestChatId || undefined, documents: localDocument ? [localDocument] : [], reply: fallback });
  }
}

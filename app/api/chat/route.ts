import { NextRequest, NextResponse } from 'next/server';

function buildFallbackReply(message: string): string {
  const text = message.toLowerCase();

  if (/formation|filiere|programme|diplome|metier|carriere/.test(text)) {
    return 'L’INPTIC propose plusieurs formations dans les domaines du numérique, de la cybersécurité, du génie logiciel, du marketing digital, de la télécommunication et de la logistique. Vous pouvez consulter les parcours disponibles dans la section formations du site pour choisir celui qui correspond à votre projet.';
  }

  if (/admission|inscription|concours|candidature|dossier|depot|suivi/.test(text)) {
    return 'Pour s’inscrire à l’INPTIC, il faut remplir le dossier de candidature, déposer les pièces demandées et suivre son dossier depuis la page de suivi. Le candidat reçoit ensuite les notifications liées à l’avancement de son admission.';
  }

  if (/prix|cout|frais|tarif|scolarite|paiement/.test(text)) {
    return 'Les frais et conditions de scolarité varient selon la formation et la procédure d’admission. Le mieux est de consulter la page d’admissions ou de contacter le service concerné pour obtenir les informations exactes.';
  }

  if (/contact|adresse|telephone|email|localisation|bureau|lieu/.test(text)) {
    return 'Vous pouvez contacter l’INPTIC via les coordonnées disponibles sur la page contact du site. La page contact contient aussi les informations utiles pour joindre l’institut directement.';
  }

  if (/vie etudiante|campus|logement|bourse|club|association|evenement/.test(text)) {
    return 'La vie étudiante à l’INPTIC comprend les activités académiques, l’encadrement, les événements et les services mis à disposition des étudiants pour faciliter leur parcours universitaire.';
  }

  if (/cyber|securite|logiciel|telecom|monetique|logistique/.test(text)) {
    return 'Les formations de l’INPTIC couvrent notamment la cybersécurité, le génie logiciel, les télécommunications, la monétique et la logistique, avec des parcours conçus pour répondre aux besoins du marché.';
  }

  if (/qui|qu'est-ce|definition|inptic|institut/.test(text)) {
    return 'L’INPTIC est l’Institut National Polytechnique des Technologies de l’Information et de la Communication. Il accompagne les étudiants dans leur formation, leur insertion professionnelle et leur développement numérique.';
  }

  if (/dossier|document|piece|pièce|cv|lettre|certificat/.test(text)) {
    return 'Le dossier de candidature comprend généralement les pièces demandées par l’admission, selon la formation. Il est important de les préparer soigneusement et de suivre leur validation dans le suivi de dossier.';
  }

  if (/directeur|dg|admin|validation|accepter|refuser/.test(text)) {
    return 'Le directeur ou l’administration peut valider ou refuser un dossier après vérification du profil et des documents. Une notification est ensuite envoyée au candidat pour lui indiquer l’état du dossier.';
  }

  return 'Je peux vous aider sur les formations, l’admission, le suivi de dossier, la vie étudiante, les contacts et les informations générales de l’INPTIC. Pour une réponse plus précise, posez une question sur un domaine précis.';
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 });
    }

    const text = String(message).trim();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: buildFallbackReply(text) });
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
            content:
              'Tu es l’assistant IA de l’INPTIC. Réponds en français, de manière claire et professionnelle. Donne des réponses utiles sur les formations, les admissions, la vie étudiante, l’institut, la candidature, le dossier et les contacts. Si tu ne sais pas, réponds de manière utile et rassurante.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return NextResponse.json({ reply: buildFallbackReply(text) });
    }

    const reply =
      data.choices?.[0]?.message?.content?.trim() || buildFallbackReply(text);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('OpenAI error:', error);
    const fallback = buildFallbackReply(String((error as Error)?.message || ''));
    return NextResponse.json({ reply: fallback });
  }
}

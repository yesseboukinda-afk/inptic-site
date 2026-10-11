export type Sentiment = 'positif' | 'neutre' | 'negatif';

const positiveTerms = [
  'excellent', 'excellente', 'excellents', 'excellentes',
  'super', 'superbe', 'superbes', 'bravo', 'felicitation', 'felicitations',
  'merci', 'remercie', 'recommande', 'recommandation', 'reussite', 'succes',
  'genial', 'geniale', 'formidable', 'parfait', 'parfaite', 'impeccable',
  'bien', 'bon', 'bonne', 'beau', 'belle', 'positif', 'positive',
  'satisfait', 'satisfaite', 'satisfaction', 'content', 'contente',
  'apprecie', 'appreciee', 'reussi', 'reussie', 'utile', 'interessant', 'interessante',
  'qualite', 'professionnel', 'professionnelle', 'accueil chaleureux',
  'tres bien', 'bonne formation', 'bon travail', 'bonne initiative',
  'bonne experience', 'bien fait', 'felicitations a',
];

const negativeTerms = [
  'nul', 'nulle', 'mauvais', 'mauvaise', 'mediocre', 'honte',
  'incompetent', 'incompetente', 'scandale', 'arnaque', 'faux', 'fausse',
  'plainte', 'decu', 'decue', 'decevant', 'decevante', 'insatisfait',
  'insatisfaite', 'mecontent', 'mecontente', 'lent', 'lente', 'retard',
  'probleme', 'problemes', 'panne', 'erreur', 'echec', 'bloque', 'bloquee',
  'impossible', 'desorganise', 'desorganisee', 'corruption', 'greve',
  'regret', 'dommage', 'inacceptable', 'inadmissible', 'cher', 'chere',
  'pas bien', 'pas bon', 'pas bonne', 'pas satisfait', 'pas satisfaite',
  'pas content', 'pas contente', 'ne fonctionne pas', 'ne marche pas',
  'pas la ligne', 'pas recu', 'pas recue', 'pas admis', 'pas admise',
  'pas retenu', 'pas retenue', 'pas gagne', 'pas reponse',
  'ne passe pas', 'ne gagne pas', 'aucune reponse', 'aucune solution',
  'trop long', 'trop lente',
  'service deplorable', 'formation deplorable',
];

const negationTerms = new Set(['ne', 'pas', 'plus', 'jamais', 'aucun', 'aucune', 'sans', 'ni']);
const sentimentWords = new Set(
  [...positiveTerms, ...negativeTerms].filter((term) => !term.includes(' ')),
);

function normalize(text: string): string[] {
  return text
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreTerms(tokens: string[], terms: string[], direction: 1 | -1): number {
  let score = 0;

  for (const term of terms) {
    const phrase = term.split(' ');
    for (let index = 0; index <= tokens.length - phrase.length; index += 1) {
      if (!phrase.every((word, offset) => tokens[index + offset] === word)) continue;

      const previousWords = tokens.slice(Math.max(0, index - 3), index);
      const lastSentimentWord = previousWords.findLastIndex((word) => sentimentWords.has(word));
      const negated = previousWords
        .slice(lastSentimentWord + 1)
        .some((word) => negationTerms.has(word));
      score += direction * (negated ? -1 : 1);
      index += phrase.length - 1;
    }
  }

  return score;
}

export function classifySentiment(content: string): Sentiment {
  const tokens = normalize(content);
  if (tokens.length === 0) return 'neutre';

  const positiveScore = scoreTerms(tokens, positiveTerms, 1);
  const negativeScore = scoreTerms(tokens, negativeTerms, -1);
  const score = positiveScore + negativeScore;

  if (score > 0) return 'positif';
  if (score < 0) return 'negatif';
  return 'neutre';
}

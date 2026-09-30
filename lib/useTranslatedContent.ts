'use client';

import { useEffect, useState } from 'react';

const translationCache = new Map<string, string>();

export function useTranslatedContent(originalText: string, currentLang: string): string {
  const [translated, setTranslated] = useState(originalText);

  useEffect(() => {
    if (!originalText || currentLang === 'fr') {
      setTranslated(originalText);
      return;
    }

    const cacheKey = `${currentLang}_${originalText}`;

    // 1. Vérifier la mémoire rapide
    if (translationCache.has(cacheKey)) {
      setTranslated(translationCache.get(cacheKey)!);
      return;
    }

    // 2. Vérifier le localStorage
    try {
      const localCached = localStorage.getItem(`inptic_trans_${cacheKey}`);
      if (localCached) {
        translationCache.set(cacheKey, localCached);
        setTranslated(localCached);
        return;
      }
    } catch {
      // ignore
    }

    // 3. Appel API de traduction dynamique
    let isMounted = true;
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: originalText, targetLang: currentLang }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.translatedText) return;
        const resText = data.translatedText;
        translationCache.set(cacheKey, resText);
        try {
          localStorage.setItem(`inptic_trans_${cacheKey}`, resText);
        } catch {
          // ignore
        }
        setTranslated(resText);
      })
      .catch(() => {
        // En cas d'erreur réseau, conserver le texte original
      });

    return () => {
      isMounted = false;
    };
  }, [originalText, currentLang]);

  return translated;
}

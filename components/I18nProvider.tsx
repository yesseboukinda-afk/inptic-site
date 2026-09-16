'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const storedLanguage = window.localStorage.getItem('inptic-lang');
    const language = storedLanguage === 'fr' || storedLanguage === 'en' || storedLanguage === 'zh' || storedLanguage === 'ar'
      ? storedLanguage
      : 'fr';

    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }

    document.documentElement.lang = language;
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

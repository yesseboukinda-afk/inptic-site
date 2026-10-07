'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslatedContent } from '@/lib/useTranslatedContent';

export default function TranslatedText({ text, className }: { text: string; className?: string }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language || 'fr';
  const translated = useTranslatedContent(text, currentLang);

  return <span className={className}>{translated}</span>;
}

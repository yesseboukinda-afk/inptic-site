'use client';

import StudentSectionPage from '@/components/StudentSectionPage';
import { useTranslation } from 'react-i18next';

export default function RelevesEtudiant() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.transcripts')}</span><StudentSectionPage section="releves" /></>;
}

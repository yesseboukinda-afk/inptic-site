'use client';

import StudentSectionPage from '@/components/StudentSectionPage';
import { useTranslation } from 'react-i18next';

export default function DiplomesEtudiant() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.degrees')}</span><StudentSectionPage section="diplomes" /></>;
}

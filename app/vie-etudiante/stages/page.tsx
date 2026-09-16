'use client';

import StudentSectionPage from '@/components/StudentSectionPage';
import { useTranslation } from 'react-i18next';

export default function StagesEtudiant() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.internships')}</span><StudentSectionPage section="stages" /></>;
}

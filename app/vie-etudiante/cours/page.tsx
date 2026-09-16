'use client';

import StudentSectionPage from '@/components/StudentSectionPage';
import { useTranslation } from 'react-i18next';

export default function CoursEtudiant() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.courses')}</span><StudentSectionPage section="cours" /></>;
}

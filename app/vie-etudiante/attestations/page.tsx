'use client';

import StudentSectionPage from '@/components/StudentSectionPage';
import { useTranslation } from 'react-i18next';

export default function AttestationsEtudiant() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.certificates')}</span><StudentSectionPage section="attestations" /></>;
}

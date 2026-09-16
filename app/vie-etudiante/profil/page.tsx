'use client';

import StudentSectionPage from '@/components/StudentSectionPage';
import { useTranslation } from 'react-i18next';

export default function ProfilEtudiant() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.profile')}</span><StudentSectionPage section="profil" /></>;
}

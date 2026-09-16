'use client';

import StudentSectionPage from '@/components/StudentSectionPage';
import { useTranslation } from 'react-i18next';

export default function EmploiDuTemps() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.schedule')}</span><StudentSectionPage section="emploi-du-temps" /></>;
}

'use client';

import StaffDashboard from '@/components/StaffDashboard';
import { useTranslation } from 'react-i18next';

export default function Scolarite() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.staff')}</span><StaffDashboard role="scolarite" /></>;
}

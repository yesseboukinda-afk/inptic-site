'use client';

import StaffDashboard from '@/components/StaffDashboard';
import { useTranslation } from 'react-i18next';

export default function ChefDepartement() {
  const { t } = useTranslation();
  return <><span className="sr-only">{t('pages.staff')}</span><StaffDashboard role="chef_departement" /></>;
}

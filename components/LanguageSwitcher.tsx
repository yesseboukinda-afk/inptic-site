'use client';

import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { t } = useTranslation();

  const changeLanguage = (lang: 'fr' | 'en' | 'zh' | 'ar') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('inptic-lang', lang);
    document.documentElement.lang = lang;
  };

  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <span className="hidden sm:inline">{t('common.language')}:</span>
      <div className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 p-1">
        <button
          type="button"
          onClick={() => changeLanguage('fr')}
          className={`rounded-full px-2 py-1 transition ${i18n.language === 'fr' ? 'bg-[#D4AF37] text-slate-900' : 'text-slate-300 hover:text-white'}`}
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          className={`rounded-full px-2 py-1 transition ${i18n.language === 'en' ? 'bg-[#D4AF37] text-slate-900' : 'text-slate-300 hover:text-white'}`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('zh')}
          className={`rounded-full px-2 py-1 transition ${i18n.language === 'zh' ? 'bg-[#D4AF37] text-slate-900' : 'text-slate-300 hover:text-white'}`}
        >
          CN
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('ar')}
          className={`rounded-full px-2 py-1 transition ${i18n.language === 'ar' ? 'bg-[#D4AF37] text-slate-900' : 'text-slate-300 hover:text-white'}`}
        >
          AR
        </button>
      </div>
    </div>
  );
}

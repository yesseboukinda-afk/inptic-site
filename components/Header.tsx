'use client';

import { Search, Moon, Sun, Globe, UserRound, ChevronDown, Menu, X, LogIn, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FormEvent, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { authClient } from '@/lib/auth-client';
import {
  canAccessStaffService,
  isSuperAdminRole,
  normalizeStaffService,
  normalizeRole,
  serviceAssignmentForRole,
  type StaffServiceAssignment,
} from '@/lib/roles';
import AccountSettingsModal from '@/components/AccountSettingsModal';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  description: string;
  submenu?: MenuItem[];
}

export default function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const menuItems: MenuItem[] = [
    {
      id: 'institut',
      label: 'INPTIC',
      href: '/institut',
      description: t('header.institutDescription'),
      submenu: [
        { id: 'presentation', label: t('header.presentation'), href: '/institut/presentation', description: '' },
        { id: 'gouvernance', label: t('header.governance'), href: '/institut/gouvernance', description: '' },
        { id: 'certifications', label: t('header.certifications'), href: '/institut/certifications', description: '' },
        { id: 'partenariats', label: t('header.partnerships'), href: '/institut/partenariats', description: '' },
      ],
    },
    {
      id: 'formations',
      label: t('header.formations'),
      href: '/formations',
      description: t('header.formationsDescription'),
      submenu: [
        { id: 'management-tic', label: t('hero.management'), href: '/formations', description: '' },
        { id: 'reseaux-systemes-numeriques', label: t('hero.networks'), href: '/formations', description: '' },
        { id: 'audiovisuel', label: t('hero.audiovisual'), href: '/formations', description: '' },
        { id: 'formations-qualifiantes', label: t('hero.qualifying'), href: '/formations', description: '' },
        { id: 'formations-certifiantes', label: t('hero.certifying'), href: '/formations', description: '' },
      ],
    },
    {
      id: 'recherche',
      label: t('header.research'),
      href: '/recherche',
      description: t('header.researchDescription'),
      submenu: [
        { id: 'publications', label: t('header.scientificPublications', 'Publications scientifiques'), href: '/recherche/publications', description: t('header.publicationsDesc', 'Travaux et articles de nos chercheurs') },
        { id: 'laboratoires', label: t('header.labs'), href: '/recherche/laboratoires', description: '' },
        { id: 'projets', label: t('header.studentProjects'), href: '/recherche/projets', description: '' },
        { id: 'incubateur', label: t('header.incubator'), href: '/recherche/incubateur', description: '' },
      ],
    },
  ];
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [accountRole, setAccountRole] = useState('');
  const [assignedService, setAssignedService] = useState<StaffServiceAssignment | ''>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchNotification, setSearchNotification] = useState('');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const mobileLanguageMenuRef = useRef<HTMLDivElement>(null);

  const languageOptions = [
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'zh', label: 'CN', flag: '🇨🇳' },
    { code: 'ar', label: 'AR', flag: '🇸🇦' },
  ] as const;

  const currentLanguage = ['fr', 'en', 'zh', 'ar'].includes(i18n.resolvedLanguage || i18n.language) ? (i18n.resolvedLanguage || i18n.language) : 'fr';
  const currentLangFlag =
    currentLanguage === 'en' ? '🇬🇧' :
    currentLanguage === 'zh' ? '🇨🇳' :
    currentLanguage === 'ar' ? '🇸🇦' : '🇫🇷';

  const canManageRH = isSuperAdmin || canAccessStaffService(accountRole, 'human_resources', assignedService);
  const canManageScolarite = isSuperAdmin || canAccessStaffService(accountRole, 'candidate_profiles', assignedService);
  const canManageAnnouncements = isSuperAdmin || canAccessStaffService(accountRole, 'announcements', assignedService);
  const dashboardHref = isSuperAdmin
    ? '/admin'
    : canManageRH
      ? '/admin/rh'
      : canManageScolarite
        ? '/scolarite'
        : canManageAnnouncements
          ? '/annonces/gestion'
          : canAccessStaffService(accountRole, 'concours', assignedService)
            ? '/concours'
            : '';
  const dashboardLabel = isSuperAdmin
    ? 'Super admin'
    : canManageRH
      ? 'Espace RH'
      : canManageScolarite
        ? 'Espace Scolarité'
        : canManageAnnouncements
          ? 'Gestion Annonces'
          : 'Direction des études';
  const hasStaffDashboard = isSuperAdmin || Boolean(dashboardHref);

  const syncAuthState = async () => {
    const { data } = await authClient.auth.getSession();
    const user = data.session?.user;
    setAccountEmail(user?.email || '');
    const role = normalizeRole(user?.app_metadata?.role ?? user?.app_metadata?.roles);
    setIsSuperAdmin(isSuperAdminRole(role));
    setAccountRole(role);
    setAssignedService(
      normalizeStaffService(user?.user_metadata?.service ?? user?.user_metadata?.department) ||
      serviceAssignmentForRole(role),
    );
    setIsStudent(role === 'etudiant');
  };

  const changeLanguage = (lang: 'fr' | 'en' | 'zh' | 'ar') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('inptic-lang', lang);
    document.documentElement.lang = lang;
    setLanguageMenuOpen(false);
  };

  useEffect(() => {
    syncAuthState();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark);
      setIsDarkMode(dark);
    };

    applyTheme(mediaQuery.matches);

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      applyTheme(event.matches);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    const handleStorage = () => syncAuthState();
    const handleAuthChange = () => syncAuthState();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideMenu = mobileMenuRef.current?.contains(target);
      const isInsideTrigger = mobileMenuButtonRef.current?.contains(target);
      const isInsideLanguageMenu =
        languageMenuRef.current?.contains(target) ||
        mobileLanguageMenuRef.current?.contains(target);

      if (!isInsideMenu && !isInsideTrigger && !isInsideLanguageMenu) {
        setMobileMenuOpen(false);
      }

      if (!isInsideLanguageMenu) {
        setLanguageMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-state-changed', handleAuthChange);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-state-changed', handleAuthChange);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [pathname]);

  const toggleDarkMode = () => {
    const nextDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', nextDarkMode);
    localStorage.setItem('inptic-theme', nextDarkMode ? 'dark' : 'light');
    setIsDarkMode(nextDarkMode);
  };

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      const formations = Array.isArray(data?.formations) ? data.formations : data?.formations?.data || [];
      const actualites = Array.isArray(data?.actualites) ? data.actualites : data?.actualites?.data || [];
      const count = formations.length + actualites.length;

      setSearchNotification(
        count
          ? `${count} résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''} pour « ${query} ».`
          : `Aucun résultat trouvé pour « ${query} ».`,
      );
    } catch {
      setSearchNotification('La recherche est momentanément indisponible.');
    } finally {
      setSearchQuery('');
      window.setTimeout(() => setSearchNotification(''), 4500);
    }
  };

  const handleLogout = async () => {
    const { error } = await authClient.auth.signOut();
    if (error) {
      window.alert(error.message);
      return;
    }

    localStorage.removeItem('inptic_directeur');
    localStorage.removeItem('inptic_user');
    localStorage.removeItem('inptic_staff');
    setIsSuperAdmin(false);
    setAccountRole('');
    setAssignedService('');
    setIsStudent(false);
    window.dispatchEvent(new Event('auth-state-changed'));
    window.location.href = '/candidat';
  };

  const toggleMobileSubmenu = (id: string) => {
    setExpandedMobileMenu((current) => (current === id ? null : id));
  };

  useEffect(() => {
    setIsHydrated(true);
    setMobileMenuOpen(false);
    setExpandedMobileMenu(null);
  }, [pathname]);

  if (!isHydrated) {
    return (
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white shadow-sm transition-shadow duration-300 md:h-18" role="banner">
        <div className="container-x flex w-full items-center gap-3 px-3 sm:px-4 md:gap-8 md:px-0">
          <Link href="/" className="flex flex-shrink-0 items-center gap-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" aria-label="INPTIC - Accueil">
            <Image src="/logoinptic.png" alt="Logo INPTIC" width={170} height={96} priority className="h-8 w-auto sm:h-9 md:h-10" />
          </Link>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <div className="hidden h-10 w-56 rounded-full border border-gray-200 bg-gray-100 lg:block" />
            <div className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-100" />
            <div className="h-10 w-28 rounded-lg border border-gray-200 bg-gray-100" />
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <div className="h-9 w-24 rounded-lg border border-gray-200 bg-gray-100" />
            <div className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-100" />
            <div className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-100" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white shadow-sm transition-shadow duration-300 md:h-18" role="banner">
        <div className="container-x flex w-full items-center gap-3 px-3 sm:px-4 md:gap-8 md:px-0">
          <Link href="/" className="flex flex-shrink-0 items-center gap-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" aria-label="INPTIC - Accueil">
            <Image src="/logoinptic.png" alt="Logo INPTIC" width={170} height={96} priority className="h-8 w-auto sm:h-9 md:h-10" />
          </Link>

          <div className="ml-auto hidden md:flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center border border-gray-300 rounded-full px-4 py-2 w-64 text-sm text-slate-400 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('common.search')}
                aria-label={t('common.search')}
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-base"
              />
              <Search size={18} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
            </form>

            <button onClick={toggleDarkMode} aria-label="Basculer le mode sombre" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95" title={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}>
              {isDarkMode ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            </button>

            {accountEmail && (
              <button
                type="button"
                onClick={() => setAccountSettingsOpen(true)}
                aria-label="Paramètres du compte"
                title="Paramètres du compte"
                className="rounded-lg p-2 text-slate-700 transition hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                <Settings size={19} aria-hidden="true" />
              </button>
            )}

            <div ref={languageMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setLanguageMenuOpen((open) => !open)}
                aria-label={t('common.switchLanguage')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#D4AF37] hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
                title={t('common.switchLanguage')}
              >
                <span aria-hidden="true">{currentLangFlag}</span>
                <span>{languageOptions.find((option) => option.code === currentLanguage)?.label ?? 'FR'}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${languageMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {languageMenuOpen && (
                <div className="absolute right-0 top-full z-[60] mt-2 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => changeLanguage(option.code)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${currentLanguage === option.code ? 'bg-[#F9F2D1] text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                      aria-label={option.label}
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true">{option.flag}</span>
                        <span>{option.label}</span>
                      </span>
                      {currentLanguage === option.code && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasStaffDashboard ? (
              <>
                <Link href={dashboardHref} className="navbar-icon-only bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95" aria-label={dashboardLabel}>
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span className="btn-label">{dashboardLabel}</span>
                </Link>
                <button onClick={handleLogout} className="navbar-icon-only bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:scale-95" aria-label={t('common.logout')}>
                  <span className="btn-label">{t('common.logout')}</span>
                  <span className="icon-slot" aria-hidden="true">↗</span>
                </button>
              </>
            ) : isStudent ? (
              <>
                <Link href="/concours" className="navbar-icon-only bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95" aria-label={t('common.concoursSpace', 'Espace Concours')}>
                  <UserRound size={16} aria-hidden="true" />
                  <span className="btn-label">{t('common.concoursSpace', 'Espace Concours')}</span>
                </Link>
                <button onClick={handleLogout} className="navbar-icon-only bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:scale-95" aria-label={t('common.logout')}>
                  <span className="btn-label">{t('common.logout')}</span>
                  <span className="icon-slot" aria-hidden="true">↗</span>
                </button>
              </>
            ) : (
              <Link href="/candidat" className="navbar-icon-only bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95" aria-label={t('common.login')}>
                <UserRound size={16} aria-hidden="true" />
                <span className="btn-label">{t('common.login')}</span>
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            {hasStaffDashboard ? (
              <>
                <Link href={dashboardHref} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900" aria-label={dashboardLabel}>
                  <LayoutDashboard size={14} aria-hidden="true" />
                  <span>{dashboardLabel}</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-2 text-xs font-semibold text-white" aria-label={t('common.logout')}>
                  <LogOut size={14} aria-hidden="true" />
                  <span>{t('common.logout')}</span>
                </button>
              </>
            ) : isStudent ? (
              <>
                <Link href="/concours" className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900" aria-label={t('common.concoursSpace', 'Espace Concours')}>
                  <UserRound size={14} aria-hidden="true" />
                  <span>{t('common.concoursSpace', 'Espace Concours')}</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-2 text-xs font-semibold text-white" aria-label={t('common.logout')}>
                  <LogOut size={14} aria-hidden="true" />
                  <span>{t('common.logout')}</span>
                </button>
              </>
            ) : (
              <Link href="/candidat" className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-2 text-xs font-semibold text-white" aria-label={t('common.login')}>
                <UserRound size={14} aria-hidden="true" />
                <span>{t('common.login')}</span>
              </Link>
            )}

            <div ref={mobileLanguageMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setLanguageMenuOpen((open) => !open)}
                aria-label={t('common.switchLanguage')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#D4AF37] hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
                title={t('common.switchLanguage')}
              >
                <span aria-hidden="true">{currentLangFlag}</span>
                <span className="hidden xs:inline">{languageOptions.find((option) => option.code === currentLanguage)?.label ?? 'FR'}</span>
              </button>

              {languageMenuOpen && (
                <div className="absolute right-0 top-full z-[60] mt-2 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => changeLanguage(option.code)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${currentLanguage === option.code ? 'bg-[#F9F2D1] text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                      aria-label={option.label}
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true">{option.flag}</span>
                        <span>{option.label}</span>
                      </span>
                      {currentLanguage === option.code && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {accountEmail && (
              <button
                type="button"
                onClick={() => setAccountSettingsOpen(true)}
                aria-label="Paramètres du compte"
                title="Paramètres du compte"
                className="rounded-lg p-2 text-slate-700 transition hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <Settings size={19} aria-hidden="true" />
              </button>
            )}

            <button ref={mobileMenuButtonRef} type="button" onClick={(event) => { event.stopPropagation(); setMobileMenuOpen((open) => !open); }} aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileMenuOpen} aria-controls="mobile-menu" className="mobile-menu-trigger rounded-lg p-2 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95">
              {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <nav className="main-nav hidden md:block sticky top-16 z-30 shadow-md transition-colors duration-300" style={{ backgroundColor: 'var(--navy)' }} role="navigation" aria-label="Menu principal">
        <div className="container-x flex flex-wrap gap-2 md:gap-6 items-center min-h-12 text-sm px-4 md:px-0">
          <Link href="/" className="nav-link transition-all duration-200 py-3 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm" role="menuitem">
            {t('common.home')}
          </Link>

          <Link href="/actualites" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm" role="menuitem">
            {t('common.news')}
          </Link>

          <Link href="/concours" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm" role="menuitem">
            {t('common.concours', 'Concours')}
          </Link>

          <Link href="/recherche/publications" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm" role="menuitem">
            {t('common.publications', 'Publications')}
          </Link>

          {menuItems.map((item) => (
            <div key={item.id} className="relative group" role="none" onMouseEnter={() => setOpenMenuId(item.id)} onMouseLeave={() => setOpenMenuId(null)}>
              <Link href={item.href} className="nav-link flex items-center gap-1 transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] group-hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm" role="menuitem" aria-haspopup={item.submenu ? 'menu' : undefined} aria-expanded={openMenuId === item.id}>
                {item.label}
                {item.submenu && <ChevronDown size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:rotate-180" />}
              </Link>

              {item.submenu && openMenuId === item.id && (
                <div className="absolute top-full left-0 mt-0 bg-white text-gray-900 rounded-b-lg shadow-2xl border border-gray-200 py-6 px-6 w-96 animate-in fade-in slide-in-from-top-2 duration-200 z-50" role="menu">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">{item.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {item.submenu.map((subitem) => (
                      <Link key={subitem.id} href={subitem.href} className="block group/item p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400" role="menuitem">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="flex items-center justify-center h-5 w-5 rounded-md bg-blue-100 group-hover/item:bg-blue-500 transition-all duration-200">
                              <svg className="h-3 w-3 text-blue-600 group-hover/item:text-white transition-colors duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 group-hover/item:text-blue-600 transition-colors duration-200">{subitem.label}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Link href="/entreprises" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm" role="menuitem">
            {t('common.companies')}
          </Link>
          <Link href="/contact" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm" role="menuitem">
            {t('common.contact')}
          </Link>
          <Link href="/annonces"
            className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            role="menuitem"
          >
            {t('common.annonces')}
          </Link>

          {isSuperAdmin && (
            <Link
              href="/directeur"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-emerald-400 font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
              role="menuitem"
            >
              {t('common.espaceDg', 'Espace DG')}
            </Link>
          )}

          {canManageAnnouncements && (
            <Link
              href="/annonces/gestion"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-amber-300 font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
              role="menuitem"
            >
              {t('common.gestionAnnonces', 'Gestion Annonces')}
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              href="/admin"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-violet-300 font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
              role="menuitem"
            >
              Super admin
            </Link>
          )}

          {canManageScolarite && (
            <Link
              href="/scolarite"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-cyan-300 font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
              role="menuitem"
            >
              {t('common.scolarite', 'Scolarité')}
            </Link>
          )}

          {canManageRH && (
            <Link
              href="/admin/rh"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-[var(--gold)] font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
              role="menuitem"
            >
              {t('common.gestionRh', 'Gestion RH')}
            </Link>
          )}
        </div>
      </nav>

      {mobileMenuOpen && (
        <nav id="mobile-menu" ref={mobileMenuRef} className="main-nav md:hidden border-b border-white/10 animate-in slide-in-from-top-2 duration-200 z-40" style={{ backgroundColor: 'var(--navy)' }} role="navigation" aria-label="Menu mobile">
          <div className="container-x px-4 py-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="mb-4 md:hidden flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
              <input type="search" placeholder={t('common.search')} aria-label={t('common.search')} className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-base" />
              <Search size={18} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
            </div>

            <Link href="/" className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              {t('common.home')}
            </Link>

            <Link href="/actualites" className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              {t('common.news')}
            </Link>

            <Link href="/concours" className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              {t('common.concours', 'Concours')}
            </Link>

            <Link href="/recherche/publications" className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              {t('common.publications', 'Publications')}
            </Link>

            {menuItems.map((item) => (
              <div key={item.id}>
                <button onClick={() => toggleMobileSubmenu(item.id)} className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900 flex items-center justify-between" aria-expanded={expandedMobileMenu === item.id} aria-haspopup={item.submenu ? 'menu' : undefined}>
                  {item.label}
                  {item.submenu && <ChevronDown size={18} className={`transition-transform duration-300 ${expandedMobileMenu === item.id ? 'rotate-180' : ''}`} aria-hidden="true" />}
                </button>

                {item.submenu && expandedMobileMenu === item.id && (
                  <div className="pl-4 space-y-1 mt-1 animate-in slide-in-from-top duration-150">
                    {item.submenu.map((subitem) => (
                      <Link key={subitem.id} href={subitem.href} className="block px-4 py-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link href="/entreprises" className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              {t('common.companies')}
            </Link>
            <Link href="/contact" className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              {t('common.contact')}
            </Link>

            <Link href="/annonces" className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              {t('common.annonces')}
            </Link>

            {isSuperAdmin && (
              <Link href="/directeur" className="block px-4 py-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold" onClick={() => setMobileMenuOpen(false)}>
                {t('common.espaceDg', 'Espace DG')}
              </Link>
            )}

            {canManageAnnouncements && (
              <Link href="/annonces/gestion" className="block px-4 py-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold" onClick={() => setMobileMenuOpen(false)}>
                {t('common.gestionAnnonces', 'Gestion Annonces')}
              </Link>
            )}

            {isSuperAdmin && (
              <Link href="/admin" className="block px-4 py-3 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold" onClick={() => setMobileMenuOpen(false)}>
                Tableau de bord superadmin
              </Link>
            )}

            {canManageScolarite && (
              <Link href="/scolarite" className="block px-4 py-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-cyan-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold" onClick={() => setMobileMenuOpen(false)}>
                {t('common.scolarite', 'Scolarité')}
              </Link>
            )}

            {canManageRH && (
              <Link href="/admin/rh" className="block px-4 py-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[var(--gold)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold" onClick={() => setMobileMenuOpen(false)}>
                {t('common.gestionRh', 'Gestion RH')}
              </Link>
            )}

          </div>
        </nav>
      )}

      {searchNotification && (
        <p className="fixed right-6 top-20 z-[100] max-w-xs rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xl dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" role="status" aria-live="polite">
          {searchNotification}
        </p>
      )}
      {accountSettingsOpen && (
        <AccountSettingsModal
          email={accountEmail}
          onClose={() => setAccountSettingsOpen(false)}
        />
      )}
    </>
  );
}

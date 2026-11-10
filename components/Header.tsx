'use client';

import { Search, Globe, UserRound, ChevronDown, Menu, X, LogIn, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
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

type SearchSuggestion = {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const menuItems: MenuItem[] = [
    {
      id: 'bibliotheque',
      label: 'Bibliothèque',
      href: '/bibliotheque',
      description: 'Explorez le catalogue de livres et retrouvez vos ouvrages.',
      submenu: [
        { id: 'library-catalog', label: 'Explorer le catalogue', href: '/bibliotheque', description: '' },
        { id: 'library-personal', label: 'Mon espace bibliothèque', href: '/bibliotheque/mon-espace', description: '' },
      ],
    },
    {
      id: 'institut',
      label: 'INPTIC',
      href: '/institut',
      description: t('header.institutDescription'),
      submenu: [
        { id: 'presentation', label: t('header.presentation'), href: '/institut/presentation', description: '' },
        { id: 'gouvernance', label: t('header.governance'), href: '/institut/gouvernance', description: '' },
        { id: 'certifications', label: t('header.certifications'), href: '/institut/certifications', description: '' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
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
  const canManageClubs = canAccessStaffService(accountRole, 'clubs', assignedService);
  const dashboardHref = isSuperAdmin
    ? '/admin'
    : canManageRH
      ? '/admin/rh'
      : canManageScolarite
        ? '/scolarite'
        : canManageAnnouncements
          ? '/veille'
          : canManageClubs
            ? '/clubs'
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
          ? 'Veille'
          : canManageClubs
            ? 'Gestion des clubs'
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
    };
  }, [pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark);
    };
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      applyTheme(event.matches);
    };

    applyTheme(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const desktopViewport = window.matchMedia('(min-width: 1024px)');
    const closeMobileMenu = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileMenuOpen(false);
    };
    desktopViewport.addEventListener('change', closeMobileMenu);
    return () => desktopViewport.removeEventListener('change', closeMobileMenu);
  }, []);

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

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      setSearchError('');
      setSelectedSuggestion(-1);
      return;
    }

    setSearchSuggestions([]);
    setSearchLoading(true);
    setSearchError('');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearchError('');
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Les suggestions de recherche sont indisponibles.');
        }
        const items: SearchSuggestion[] = Array.isArray(data.items) ? data.items : [];
        setSearchSuggestions(items);
        setSelectedSuggestion(-1);
        if (data.partial) {
          setSearchError('Certaines sources sont indisponibles; les autres résultats restent affichés.');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchSuggestions([]);
          setSearchError(error instanceof Error ? error.message : 'Les suggestions de recherche sont indisponibles.');
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    setSearchQuery('');
    setSearchFocused(false);
    setSearchSuggestions([]);
  }, [pathname]);

  const selectSearchSuggestion = (suggestion: SearchSuggestion) => {
    setSearchFocused(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
    router.push(suggestion.href);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && searchSuggestions.length) {
      event.preventDefault();
      setSelectedSuggestion((current) => (current + 1) % searchSuggestions.length);
    } else if (event.key === 'ArrowUp' && searchSuggestions.length) {
      event.preventDefault();
      setSelectedSuggestion((current) =>
        current <= 0 ? searchSuggestions.length - 1 : current - 1,
      );
    } else if (event.key === 'Enter' && selectedSuggestion >= 0) {
      event.preventDefault();
      selectSearchSuggestion(searchSuggestions[selectedSuggestion]);
    } else if (event.key === 'Escape') {
      setSearchFocused(false);
      setSelectedSuggestion(-1);
    }
  };

  const renderSearchSuggestions = (id: string) => {
    if (!searchFocused || searchQuery.trim().length < 2) return null;
    return (
      <div
        id={id}
        role="listbox"
        className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-left text-slate-900 shadow-xl"
      >
        {searchLoading ? (
          <p className="px-4 py-3 text-sm text-slate-500">{t('public.searching')}</p>
        ) : searchError && !searchSuggestions.length ? (
          <p className="px-4 py-3 text-sm text-rose-700">{searchError}</p>
        ) : searchSuggestions.length ? (
          <>
            {searchError && <p className="px-4 py-2 text-xs text-amber-700">{searchError}</p>}
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={selectedSuggestion === index}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setSelectedSuggestion(index)}
                onClick={() => selectSearchSuggestion(suggestion)}
                id={`${id}-option-${index}`}
                className={`block w-full px-4 py-2.5 text-left transition ${
                  selectedSuggestion === index ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="block truncate text-sm font-semibold">{suggestion.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{suggestion.category}</span>
                {suggestion.description && (
                  <span className="mt-1 line-clamp-2 block text-xs text-slate-600">{suggestion.description}</span>
                )}
              </button>
            ))}
            <button
              type="submit"
              onMouseDown={(event) => event.preventDefault()}
              className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-xs font-bold text-blue-700 hover:bg-blue-50"
            >
              Voir tous les résultats pour « {searchQuery.trim()} »
            </button>
          </>
        ) : (
          <p className="px-4 py-3 text-sm text-slate-500">Aucune suggestion. Appuyez sur Entrée pour lancer la recherche.</p>
        )}
      </div>
    );
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
      <>
        <header className="sticky top-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white shadow-sm transition-shadow duration-300 md:h-18" role="banner">
          <div className="container-x flex w-full items-center gap-3 px-3 sm:px-4 md:gap-8 md:px-0">
            <Link href="/" className="flex flex-shrink-0 items-center gap-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" aria-label="INPTIC - Accueil">
              <img src="/logoinptic.ico" alt="Logo INPTIC" width={71} height={40} className="h-8 w-14 object-contain sm:h-9 sm:w-16 md:h-10 md:w-[71px]" />
            </Link>

            <div className="ml-auto hidden items-center gap-3 lg:flex">
              <div className="hidden h-10 w-56 rounded-full border border-gray-200 bg-gray-100 lg:block" />
              <div className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-100" />
              <div className="h-10 w-28 rounded-lg border border-gray-200 bg-gray-100" />
            </div>

            <div className="ml-auto flex items-center gap-2 lg:hidden">
              <div className="h-9 w-24 rounded-lg border border-gray-200 bg-gray-100" />
              <div className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-100" />
              <div className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-100" />
            </div>
          </div>
        </header>
        <nav
          className="site-legacy-nav-fallback main-nav"
          style={{ backgroundColor: 'var(--navy)' }}
          aria-label="Navigation de secours"
        >
          <details>
            <summary>Menu de navigation</summary>
            <div className="site-legacy-nav-links">
              <Link href="/">{t('common.home')}</Link>
              <Link href="/actualites">{t('common.news')}</Link>
              <Link href="/concours">{t('common.concours', 'Concours')}</Link>
              <Link href="/recherche/publications">{t('common.publications', 'Publications')}</Link>
              <Link href="/clubs">Clubs</Link>
              {menuItems.map((item) => (
                <div key={item.id}>
                  <Link href={item.href}>{item.label}</Link>
                  {item.submenu?.map((subitem) => (
                    <Link key={subitem.id} href={subitem.href} className="site-legacy-nav-subitem">
                      {subitem.label}
                    </Link>
                  ))}
                </div>
              ))}
              <Link href="/entreprises">{t('common.companies')}</Link>
              <Link href="/contact">{t('common.contact')}</Link>
              <Link href="/annonces">{t('common.annonces')}</Link>
              <Link href="/candidat">{t('common.login')}</Link>
            </div>
          </details>
        </nav>
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-[70] flex h-16 items-center border-b border-slate-200 bg-white shadow-sm transition-shadow duration-300 md:h-18 lg:z-50" role="banner">
        <div className="container-x flex w-full items-center gap-3 px-3 sm:px-4 md:gap-8 md:px-0">
          <Link href="/" className="flex flex-shrink-0 items-center gap-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" aria-label="INPTIC - Accueil">
            <img src="/logoinptic.ico" alt="Logo INPTIC" width={71} height={40} className="h-8 w-14 object-contain sm:h-9 sm:w-16 md:h-10 md:w-[71px]" />
          </Link>

          <div className="site-header-desktop-actions ml-auto hidden items-center gap-3 lg:flex">
            <form action="/recherche" method="get" role="search" className="relative hidden lg:flex items-center border border-gray-300 rounded-full px-4 py-2 w-64 text-sm text-slate-400 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
              <input
                type="search"
                name="q"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('common.search')}
                aria-label={t('common.search')}
                role="combobox"
                aria-autocomplete="list"
                aria-controls="header-search-suggestions-desktop"
                aria-activedescendant={selectedSuggestion >= 0 ? `header-search-suggestions-desktop-option-${selectedSuggestion}` : undefined}
                aria-expanded={searchFocused && searchQuery.trim().length >= 2}
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-base"
              />
              <button type="submit" aria-label={t('common.search')} className="shrink-0 rounded-full p-1 text-slate-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <Search size={18} aria-hidden="true" />
              </button>
              {renderSearchSuggestions('header-search-suggestions-desktop')}
            </form>

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

          <div className="site-header-mobile-actions ml-auto flex items-center gap-2 lg:hidden">
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
                <div className="fixed right-2 top-[3.625rem] z-[80] mt-2 flex w-max max-w-[calc(100vw-1rem)] items-center gap-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl md:top-[3.9375rem]">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => changeLanguage(option.code)}
                      className={`flex min-h-10 min-w-12 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm transition ${currentLanguage === option.code ? 'bg-[#F9F2D1] text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                      aria-label={option.label}
                    >
                      <span aria-hidden="true">{option.flag}</span>
                      <span>{option.label}</span>
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

      <nav className="site-primary-nav main-nav sticky top-[4.5rem] z-30 hidden shadow-md transition-colors duration-300 lg:block" style={{ backgroundColor: 'var(--navy)' }} role="navigation" aria-label="Menu principal">
        <div className="container-x flex flex-wrap gap-2 md:gap-6 items-center min-h-12 text-sm px-4 md:px-0">
          <Link href="/" className="nav-link transition-all duration-200 py-3 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm">
            {t('common.home')}
          </Link>

          <Link href="/actualites" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm">
            {t('common.news')}
          </Link>

          <Link href="/concours" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm">
            {t('common.concours', 'Concours')}
          </Link>

          <Link href="/recherche/publications" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm">
            {t('common.publications', 'Publications')}
          </Link>
          <Link href="/clubs" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm">
            Clubs
          </Link>

          {menuItems.map((item) => (
            <div key={item.id} className="relative group" onMouseEnter={() => setOpenMenuId(item.id)} onMouseLeave={() => setOpenMenuId(null)}>
              <Link href={item.href} className="nav-link flex items-center gap-1 transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] group-hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm" aria-expanded={item.submenu ? openMenuId === item.id : undefined}>
                {item.label}
                {item.submenu && <ChevronDown size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:rotate-180" />}
              </Link>

              {item.submenu && openMenuId === item.id && (
                <div className="absolute top-full left-0 mt-0 bg-white text-gray-900 rounded-b-lg shadow-2xl border border-gray-200 py-6 px-6 w-96 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">{item.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {item.submenu.map((subitem) => (
                      <Link key={subitem.id} href={subitem.href} className="block group/item p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
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

          <Link href="/entreprises" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm">
            {t('common.companies')}
          </Link>
          <Link href="/contact" className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm">
            {t('common.contact')}
          </Link>
          <Link href="/annonces"
            className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
          >
            {t('common.annonces')}
          </Link>

          {isSuperAdmin && (
            <Link
              href="/directeur"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-emerald-400 font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            >
              {t('common.espaceDg', 'Espace DG')}
            </Link>
          )}

          {canManageAnnouncements && (
            <Link
              href="/veille"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-amber-300 font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            >
              {t('common.gestionAnnonces', 'Veille')}
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              href="/admin"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-violet-300 font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            >
              Super admin
            </Link>
          )}

          {canManageScolarite && (
            <Link
              href="/scolarite"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-cyan-300 font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            >
              {t('common.scolarite', 'Scolarité')}
            </Link>
          )}

          {canManageRH && (
            <Link
              href="/admin/rh"
              className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent text-[var(--gold)] font-bold hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            >
              {t('common.gestionRh', 'Gestion RH')}
            </Link>
          )}
        </div>
      </nav>

      {mobileMenuOpen && (
        <nav id="mobile-menu" ref={mobileMenuRef} className="site-mobile-nav main-nav fixed inset-x-0 bottom-0 top-16 z-[60] overflow-y-auto overscroll-contain border-b border-white/10 shadow-2xl animate-in slide-in-from-top-2 duration-200 md:top-[4.5rem] lg:hidden" style={{ backgroundColor: 'var(--navy)' }} role="navigation" aria-label="Menu mobile">
          <div className="container-x space-y-2 px-4 py-4">
            <form action="/recherche" method="get" role="search" className="relative mb-4 flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
              <input
                type="search"
                name="q"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('common.search')}
                aria-label={t('common.search')}
                role="combobox"
                aria-autocomplete="list"
                aria-controls="header-search-suggestions-mobile"
                aria-activedescendant={selectedSuggestion >= 0 ? `header-search-suggestions-mobile-option-${selectedSuggestion}` : undefined}
                aria-expanded={searchFocused && searchQuery.trim().length >= 2}
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-base"
              />
              <button type="submit" aria-label={t('common.search')} className="shrink-0 rounded p-1 text-slate-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <Search size={18} aria-hidden="true" />
              </button>
              {renderSearchSuggestions('header-search-suggestions-mobile')}
            </form>

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
            <Link href="/clubs" className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              Clubs
            </Link>

            {menuItems.map((item) => (
              <div key={item.id}>
                <button onClick={() => toggleMobileSubmenu(item.id)} className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900 flex items-center justify-between" aria-expanded={expandedMobileMenu === item.id}>
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
              <Link href="/veille" className="block px-4 py-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold" onClick={() => setMobileMenuOpen(false)}>
                {t('common.gestionAnnonces', 'Veille')}
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

      {accountSettingsOpen && (
        <AccountSettingsModal
          email={accountEmail}
          onClose={() => setAccountSettingsOpen(false)}
        />
      )}
    </>
  );
}

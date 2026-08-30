'use client';
import { Search, Moon, Globe, UserRound, ChevronDown, Menu, X, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  description: string;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'institut',
    label: 'INPTIC',
    href: '/institut',
    description: 'Présentation, gouvernance, certifications',
    submenu: [
      { id: 'presentation', label: 'Présentation', href: '/institut/presentation', description: '' },
      { id: 'gouvernance', label: 'Gouvernance', href: '/institut/gouvernance', description: '' },
      { id: 'certifications', label: 'Certifications', href: '/institut/certifications', description: '' },
      { id: 'partenariats', label: 'Partenariats', href: '/institut/partenariats', description: '' },
    ],
  },
  {
    id: 'formations',
    label: 'Formations',
    href: '/formations',
    description: 'Catalogue des filières',
    submenu: [
      { id: 'management-tic', label: 'Management des TIC', href: '/formations', description: '' },
      { id: 'reseaux-systemes-numeriques', label: 'Réseaux et Systèmes Numériques', href: '/formations', description: '' },
      { id: 'audiovisuel', label: 'Audiovisuel', href: '/formations', description: '' },
      { id: 'formations-qualifiantes', label: 'Formations qualifiantes', href: '/formations', description: '' },
      { id: 'formations-certifiantes', label: 'Formations certifiantes', href: '/formations', description: '' },
    ],
  },
  {
    id: 'admissions',
    label: 'Admissions',
    href: '/admissions',
    description: 'Concours & admission',
    submenu: [
      { id: 'guide', label: 'Guide d\'admission', href: '/admissions/guide', description: '' },
      { id: 'calculateur', label: 'Calculateur d\'éligibilité', href: '/admissions/calculateur', description: '' },
      { id: 'depot', label: 'Dépôt de dossier', href: '/admissions/depot', description: '' },
      { id: 'suivi', label: 'Suivi en temps réel', href: '/admissions/suivi', description: '' },
    ],
  },
  {
    id: 'recherche',
    label: 'Recherche & Innovation',
    href: '/recherche',
    description: 'Laboratoires et projets',
    submenu: [
      { id: 'laboratoires', label: 'Laboratoires', href: '/recherche/laboratoires', description: '' },
      { id: 'projets', label: 'Projets étudiants', href: '/recherche/projets', description: '' },
      { id: 'incubateur', label: 'Incubateur Tech/Startups', href: '/recherche/incubateur', description: '' },
    ],
  },
];

export default function Header() {
  const pathname = usePathname();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const [isDirector, setIsDirector] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const syncAuthState = () => {
    const director = localStorage.getItem('inptic_directeur');
    const student = localStorage.getItem('inptic_user');
    setIsDirector(Boolean(director));
    setIsStudent(Boolean(student));
  };

  useEffect(() => {
    syncAuthState();

    const handleStorage = () => syncAuthState();
    const handleAuthChange = () => syncAuthState();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideMenu = mobileMenuRef.current?.contains(target);
      const isInsideTrigger = mobileMenuButtonRef.current?.contains(target);

      if (!isInsideMenu && !isInsideTrigger) {
        setMobileMenuOpen(false);
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

  const handleLogout = () => {
    localStorage.removeItem('inptic_directeur');
    localStorage.removeItem('inptic_user');
    setIsDirector(false);
    setIsStudent(false);
    window.dispatchEvent(new Event('auth-state-changed'));
    window.location.href = '/candidat';
  };

  const toggleMobileSubmenu = (id: string) => {
    setExpandedMobileMenu((current) => (current === id ? null : id));
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setExpandedMobileMenu(null);
  }, [pathname]);

  return (
    <>
      <header
        className="sticky top-0 z-40 flex h-16 items-center border-b border-slate-200 bg-white shadow-sm transition-shadow duration-300 md:h-18"
        role="banner"
      >
        <div className="container-x flex w-full items-center gap-3 px-3 sm:px-4 md:gap-8 md:px-0">
          <Link
            href="/"
            className="flex flex-shrink-0 items-center gap-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            aria-label="INPTIC - Accueil"
          >
            <img
              src="/logoinptic.png"
              alt="Logo INPTIC"
              className="h-8 w-auto sm:h-9 md:h-10"
            />
          </Link>

          <div className="ml-auto hidden md:flex items-center gap-4">
            <div className="hidden lg:flex items-center border border-gray-300 rounded-full px-4 py-2 w-64 text-sm text-slate-400 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
              <input 
                type="search"
                placeholder="Rechercher..."
                aria-label="Rechercher sur le site"
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-base"
              />
              <Search size={18} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
            </div>

            <button
              aria-label="Basculer le mode sombre"
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
              title="Mode sombre"
            >
              <Moon size={19} aria-hidden="true" />
            </button>

            <button
              aria-label="Changer la langue"
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
              title="Changer la langue"
            >
              <Globe size={19} aria-hidden="true" />
            </button>
            <span className="text-sm font-medium px-1">FR</span>

            {isDirector ? (
              <>
                <Link
                  href="/directeur"
                  className="navbar-icon-only bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
                  aria-label="Tableau de bord"
                >
                  <span className="btn-label">Tableau de bord</span>
                  <span className="icon-slot" aria-hidden="true">▣</span>
                </Link>
                <Link
                  href="/directeur/compte"
                  className="navbar-icon-only bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
                  aria-label="Profil"
                >
                  <UserRound size={16} aria-hidden="true" />
                  <span className="btn-label">Profil</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="navbar-icon-only bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:scale-95"
                  aria-label="Déconnexion"
                >
                  <span className="btn-label">Déconnexion</span>
                  <span className="icon-slot" aria-hidden="true">↗</span>
                </button>
              </>
            ) : isStudent ? (
              <>
                <Link
                  href="/vie-etudiante"
                  className="navbar-icon-only bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
                  aria-label="Mon compte"
                >
                  <UserRound size={16} aria-hidden="true" />
                  <span className="btn-label">Mon compte</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="navbar-icon-only bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:scale-95"
                  aria-label="Déconnexion"
                >
                  <span className="btn-label">Déconnexion</span>
                  <span className="icon-slot" aria-hidden="true">↗</span>
                </button>
              </>
            ) : (
              <Link
                href="/candidat"
                className="navbar-icon-only bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
                aria-label="Connexion"
              >
                <UserRound size={16} aria-hidden="true" />
                <span className="btn-label">Connexion</span>
              </Link>
            )}
          </div>

          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMobileMenuOpen((open) => !open);
            }}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            className="mobile-menu-trigger md:hidden ml-auto rounded-lg p-2 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95"
          >
            {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <nav 
        className="main-nav hidden md:block sticky top-16 z-40 shadow-md transition-colors duration-300"
        style={{ backgroundColor: 'var(--navy)' }}
        role="navigation"
        aria-label="Menu principal"
      >
        <div className="container-x flex flex-wrap gap-2 md:gap-6 items-center min-h-12 text-sm px-4 md:px-0">
          <Link 
            href="/" 
            className="nav-link transition-all duration-200 py-3 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            role="menuitem"
          >
            Accueil
          </Link>
          
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="relative group"
              role="none"
              onMouseEnter={() => setOpenMenuId(item.id)}
              onMouseLeave={() => setOpenMenuId(null)}
            >
              <Link
                href={item.href}
                className="nav-link flex items-center gap-1 transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] group-hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
                role="menuitem"
                aria-haspopup={item.submenu ? "menu" : undefined}
                aria-expanded={openMenuId === item.id}
              >
                {item.label}
                {item.submenu && <ChevronDown size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:rotate-180" />}
              </Link>

              {item.submenu && openMenuId === item.id && (
                <div 
                  className="absolute top-full left-0 mt-0 bg-white text-gray-900 rounded-b-lg shadow-2xl border border-gray-200 py-6 px-6 w-96 animate-in fade-in slide-in-from-top-2 duration-200 z-50"
                  role="menu"
                >
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">{item.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.id}
                        href={subitem.href}
                        className="block group/item p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        role="menuitem"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="flex items-center justify-center h-5 w-5 rounded-md bg-blue-100 group-hover/item:bg-blue-500 transition-all duration-200">
                              <svg
                                className="h-3 w-3 text-blue-600 group-hover/item:text-white transition-colors duration-200"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 group-hover/item:text-blue-600 transition-colors duration-200">
                              {subitem.label}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <Link 
            href="/entreprises" 
            className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            role="menuitem"
          >
            Entreprises
          </Link>
          <Link 
            href="/contact" 
            className="nav-link transition-all duration-200 py-3 px-2 border-b-2 border-transparent hover:text-[var(--gold)] hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-sm"
            role="menuitem"
          >
            Contact
          </Link>
        </div>
      </nav>

      {mobileMenuOpen && (
        <nav 
          id="mobile-menu"
          ref={mobileMenuRef}
          className="main-nav md:hidden border-b border-white/10 animate-in slide-in-from-top-2 duration-200 z-40"
          style={{ backgroundColor: 'var(--navy)' }}
          role="navigation"
          aria-label="Menu mobile"
        >
          <div className="container-x px-4 py-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="mb-4 md:hidden flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
              <input 
                type="search"
                placeholder="Rechercher..."
                aria-label="Rechercher sur le site"
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-base"
              />
              <Search size={18} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
            </div>

            <Link 
              href="/" 
              className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Accueil
            </Link>

            {menuItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => toggleMobileSubmenu(item.id)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900 flex items-center justify-between"
                  aria-expanded={expandedMobileMenu === item.id}
                  aria-haspopup={item.submenu ? "menu" : undefined}
                >
                  {item.label}
                  {item.submenu && (
                    <ChevronDown 
                      size={18} 
                      className={`transition-transform duration-300 ${expandedMobileMenu === item.id ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </button>

                {item.submenu && expandedMobileMenu === item.id && (
                  <div className="pl-4 space-y-1 mt-1 animate-in slide-in-from-top duration-150">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.id}
                        href={subitem.href}
                        className="block px-4 py-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link 
              href="/entreprises" 
              className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Entreprises
            </Link>
            <Link 
              href="/contact" 
              className="block px-4 py-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {isDirector ? (
              <div className="mt-4 flex gap-2">
                <Link
                  href="/directeur"
                  aria-label="Tableau de bord"
                  className="navbar-icon-only flex-1 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white px-4 py-3 rounded-lg text-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} aria-hidden="true" />
                  <span className="btn-label">Tableau de bord</span>
                </Link>
                <Link
                  href="/directeur/compte"
                  aria-label="Profil"
                  className="navbar-icon-only flex-1 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 px-4 py-3 rounded-lg text-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserRound size={18} aria-hidden="true" />
                  <span className="btn-label">Profil</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  aria-label="Déconnexion"
                  className="navbar-icon-only flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-3 rounded-lg text-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                >
                  <LogOut size={18} aria-hidden="true" />
                  <span className="btn-label">Déconnexion</span>
                </button>
              </div>
            ) : isStudent ? (
              <div className="mt-4 flex gap-2">
                <Link
                  href="/vie-etudiante"
                  aria-label="Mon compte"
                  className="navbar-icon-only flex-1 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 px-4 py-3 rounded-lg text-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserRound size={18} aria-hidden="true" />
                  <span className="btn-label">Mon compte</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  aria-label="Déconnexion"
                  className="navbar-icon-only flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-3 rounded-lg text-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                >
                  <LogOut size={18} aria-hidden="true" />
                  <span className="btn-label">Déconnexion</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <Link 
                  href="/candidat" 
                  aria-label="Connexion"
                  className="navbar-icon-only flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 rounded-lg text-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn size={18} aria-hidden="true" />
                  <span className="btn-label">Connexion</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </>
  );
}

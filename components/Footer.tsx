 'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setIsSubscribed(Boolean(localStorage.getItem('inptic-newsletter-email')));
  }, []);

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNewsletterMessage('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    localStorage.setItem('inptic-newsletter-email', normalizedEmail);
    setEmail('');
    setIsSubscribed(true);
    setNewsletterMessage('Inscription confirmée. Merci !');
  };

  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="container-x px-4 py-12 md:px-0">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <Image src="/logoinptic.png" alt="Logo INPTIC" width={170} height={96} className="h-10 w-auto" />
            </div>
            <p className="max-w-xs text-sm leading-6 text-slate-300">
              Institut National de la poste, des Technologies de l’Information et de la Communication.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">INPTIC</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="/institut" className="transition-colors duration-200 hover:text-[#D4AF37]">Présentation</a></li>
              <li><a href="/institut/certifications" className="transition-colors duration-200 hover:text-[#D4AF37]">Certifications</a></li>
              <li><a href="/institut/partenariats" className="transition-colors duration-200 hover:text-[#D4AF37]">Partenariats</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Formations</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="/formations" className="transition-colors duration-200 hover:text-[#D4AF37]">Catalogue</a></li>
              <li><a href="/formations/telecoms" className="transition-colors duration-200 hover:text-[#D4AF37]">Télécoms</a></li>
              <li><a href="/formations/genie-logiciel" className="transition-colors duration-200 hover:text-[#D4AF37]">Génie Logiciel</a></li>
              <li><a href="/formations/cybersecurite" className="transition-colors duration-200 hover:text-[#D4AF37]">Cybersécurité</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="/contact" className="transition-colors duration-200 hover:text-[#D4AF37]">Nous écrire</a></li>
              <li><a href="/admissions" className="transition-colors duration-200 hover:text-[#D4AF37]">Admissions</a></li>
              <li><a href="/vie-etudiante" className="transition-colors duration-200 hover:text-[#D4AF37]">Vie étudiante</a></li>
              <li><a href="/entreprises" className="transition-colors duration-200 hover:text-[#D4AF37]">Entreprises</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">{t('footer.newsletterTitle')}</h3>
            <p className="mt-4 text-sm leading-6 text-slate-300">{t('footer.newsletterText')}</p>
            <form className="mt-3 flex items-stretch gap-2 sm:flex-row" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setNewsletterMessage('');
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#D4AF37]"
                placeholder={t('footer.emailPlaceholder')}
                aria-label={t('footer.emailPlaceholder')}
                disabled={isSubscribed}
                required
              />
              <button
                type="submit"
                disabled={isSubscribed}
                className="mobile-icon-action inline-flex h-[48px] shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#c89d2c] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                aria-label="S’inscrire à la newsletter"
                title="S’inscrire à la newsletter"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M4 4h16v16H4z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
                <span className="btn-label">{isSubscribed ? t('footer.subscribed') : t('footer.subscribe')}</span>
              </button>
            </form>
            {newsletterMessage && (
              <p className="mt-2 text-xs text-[#F4D06F]" role="status" aria-live="polite">
                {newsletterMessage}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-3 text-center text-xs text-slate-400 md:justify-start md:text-sm">
              <span>© {currentYear} INPTIC Gabon. {t('footer.rights')}</span>
              <span className="hidden md:inline-block text-slate-600">|</span>
              <a href="/confidentialite" className="transition-colors duration-200 hover:text-[#D4AF37]">
                {t('footer.privacy')}
              </a>
              <a href="/conditions-d-utilisation" className="transition-colors duration-200 hover:text-[#D4AF37]">
                {t('footer.terms')}
              </a>
              <span className="hidden md:inline-block text-slate-600">|</span>
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com/share/1JiVyPnGRj/?mibextid=wwXIfr" target="_blank" rel="noreferrer" aria-label="Facebook INPTIGabon" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                  <img src="/connexion/facebook_icon.svg" alt="Facebook" className="h-4 w-4" />
                </a>
                <a href="https://whatsapp.com/channel/0029VagrNh3KQuJBA9v3Zc3i" target="_blank" rel="noreferrer" aria-label="WhatsApp INPTIGabon" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                  <img src="/connexion/whatsapp.svg" alt="WhatsApp" className="h-4 w-4" />
                </a>
                <a href="https://www.youtube.com/@INPTICGabonOfficiel" target="_blank" rel="noreferrer" aria-label="YouTube INPTICGabonOfficiel" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                  <img src="/connexion/youtube.svg" alt="YouTube" className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 md:text-sm">
             
              <div className="flex items-center gap-2">
                <span>dev by :</span>
                <a
                  href="https://github.com/yesseboukinda-afk/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Voir le dépôt GitHub INPTIC"
                  title="GitHub INPTIC"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  <img src="/connexion/github.png" alt="GitHub" className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

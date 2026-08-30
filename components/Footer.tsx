export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="container-x px-4 py-12 md:px-0">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <img src="/logoinptic.png" alt="Logo INPTIC" className="h-10 w-auto" />
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
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Newsletter</h3>
            <p className="mt-4 text-sm leading-6 text-slate-300">Restez informé de nos actualités.</p>
            <div className="mt-3 flex items-stretch gap-2 sm:flex-row">
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#D4AF37]"
                placeholder="Votre email"
                aria-label="Votre email"
              />
              <button
                type="button"
                className="mobile-icon-action inline-flex h-[48px] shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#c89d2c] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                aria-label="S’inscrire à la newsletter"
                title="S’inscrire à la newsletter"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M4 4h16v16H4z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
                <span className="btn-label">S’inscrire</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-400">
          © 2025 INPTIC Gabon. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

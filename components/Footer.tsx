"use client";

import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Github } from "lucide-react";
import InstallPWA from "@/components/InstallPWA";
import { COOKIE_PREFERENCES_EVENT } from "@/lib/cookie-consent";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState(false);

  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (isSubmitting || isSubscribed) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNewsletterError(true);
      setNewsletterMessage(
        "Veuillez saisir une adresse e-mail valide."
      );
      return;
    }

    setIsSubmitting(true);
    setNewsletterError(false);
    setNewsletterMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur");
      }

      setEmail("");
      setIsSubscribed(true);

      setNewsletterMessage(
        data.message ||
          "Inscription confirmée ! Consultez votre boîte e-mail."
      );
    } catch (error) {
      setNewsletterError(true);
      setNewsletterMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer votre inscription. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="container-x px-4 py-12 md:px-0">
        {/* Colonnes principales */}
        <div className="grid gap-10 md:grid-cols-5">
          {/* Présentation */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src="/logoinptic.ico"
                alt="Logo INPTIC"
                width={71}
                height={40}
                className="h-10 w-auto"
              />
            </div>

            <p className="max-w-xs text-sm leading-6 text-slate-300">
              {t("footer.instituteDescription")}
            </p>
          </div>

          {/* Institut */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
              {t("footer.institute")}
            </h3>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <a
                  href="/institut"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.presentation")}
                </a>
              </li>

              <li>
                <a
                  href="/institut/certifications"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.certifications")}
                </a>
              </li>

            </ul>
          </div>

          {/* Formations */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
              {t("footer.formationsTitle", "Formations")}
            </h3>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <a
                  href="/formations"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.catalog")}
                </a>
              </li>

              <li>
                <a
                  href="/formations/telecoms"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.telecoms")}
                </a>
              </li>

              <li>
                <a
                  href="/formations/genie-logiciel"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.softwareEngineering")}
                </a>
              </li>

              <li>
                <a
                  href="/formations/cybersecurite"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.cybersecurity")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
              {t("footer.contactTitle", "Contact")}
            </h3>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <a
                  href="/contact"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.writeUs")}
                </a>
              </li>

              <li>
                <a
                  href="/admissions"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.admissions")}
                </a>
              </li>

              <li>
                <a
                  href="/concours"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t(
                    "footer.concoursAndResults",
                    "Concours & Résultats"
                  )}
                </a>
              </li>

              <li>
                <a
                  href="/vie-etudiante"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.studentLife")}
                </a>
              </li>

              <li>
                <a
                  href="/entreprises"
                  className="transition-colors duration-200 hover:text-[#D4AF37]"
                >
                  {t("footer.companies")}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div id="newsletter">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
              {t("footer.newsletterTitle")}
            </h3>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              {t("footer.newsletterText")}
            </p>

            <form
              className="mt-3 flex items-stretch gap-2 sm:flex-row"
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setNewsletterMessage("");
                  setNewsletterError(false);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#D4AF37]"
                placeholder={t("footer.emailPlaceholder")}
                aria-label={t("footer.emailPlaceholder")}
                disabled={isSubscribed || isSubmitting}
                required
              />

              <button
                type="submit"
                disabled={isSubscribed || isSubmitting}
                className="mobile-icon-action inline-flex h-[48px] shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#c89d2c] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                aria-label="S’inscrire à la newsletter"
                title="S’inscrire à la newsletter"
              >
                {isSubmitting ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 shrink-0 animate-spin"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M4 4h16v16H4z" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                )}

                <span className="btn-label whitespace-nowrap">
                  {isSubscribed ? t("footer.subscribed") : isSubmitting ? "Envoi…" : t("footer.subscribe")}
                </span>
              </button>
            </form>

            {isSubmitting && (
              <p
                className="mt-2 flex items-center gap-2 text-xs text-[#F4D06F]"
                role="status"
                aria-live="polite"
              >
                <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#F4D06F]" aria-hidden="true" />
                Veuillez patienter pendant l’enregistrement de votre inscription…
              </p>
            )}

            {newsletterMessage && (
              <p
                className={`mt-2 text-xs ${newsletterError ? "text-red-300" : "text-[#F4D06F]"}`}
                role="status"
                aria-live="polite"
              >
                {newsletterMessage}
              </p>
            )}
          </div>
        </div>

        {/* Partie basse */}
        <div className="mt-10 border-t border-slate-800 pt-6">
          {/* Installation PWA */}
          <div className="mb-6 flex justify-center">
            <InstallPWA />
          </div>

          <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
            {/* Copyright + liens */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-center text-xs text-slate-400 md:justify-start md:text-sm">
              <span>
                © {currentYear} INPTIC Gabon.{" "}
                {t("footer.rights")}
              </span>

              <span className="hidden text-slate-600 md:inline-block">
                |
              </span>

              <a
                href="/confidentialite"
                className="transition-colors duration-200 hover:text-[#D4AF37]"
              >
                {t("footer.privacy")}
              </a>

              <a
                href="/conditions-d-utilisation"
                className="transition-colors duration-200 hover:text-[#D4AF37]"
              >
                {t("footer.terms")}
              </a>

              <a
                href="/bibliotheque/mentions-legales"
                className="transition-colors duration-200 hover:text-[#D4AF37]"
              >
                Mentions légales de la bibliothèque
              </a>

              <a
                href="/textes-et-lois"
                className="transition-colors duration-200 hover:text-[#D4AF37]"
              >
                {t(
                  "footer.textsAndLaws",
                  "Textes et lois"
                )}
              </a>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))}
                className="transition-colors duration-200 hover:text-[#D4AF37]"
              >
                {t("cookieConsent.settings", "Préférences cookies")}
              </button>

            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center justify-center gap-2">
              <a
                href="https://www.facebook.com/share/1JiVyPnGRj/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook INPTIGabon"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <img
                  src="/connexion/facebook_icon.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </a>

              <a
                href="https://whatsapp.com/channel/0029VagrNh3KQuJBA9v3Zc3i"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp INPTIGabon"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <img
                  src="/connexion/whatsapp.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </a>

              <a
                href="https://www.youtube.com/@INPTICGabonOfficiel"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube INPTICGabonOfficiel"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <img
                  src="/connexion/youtube.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </a>

              <a
                href="https://www.tiktok.com/@inptic.gabon.offi"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok Inptic Gabon Officiel"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <img
                  src="/connexion/tiktok-icon.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </a>
            </div>

            {/* Développeur */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 md:justify-end md:text-sm">
             <div className="flex items-center gap-2">


                <a
                  href="https://github.com/yesseboukinda-afk/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Voir le dépôt GitHub INPTIC"
                  title="GitHub develloper"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors duration-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  <Github size={20} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
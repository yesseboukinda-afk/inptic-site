
import "./globals.css";
import { ReactNode } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import BackToTop from "@/components/BackToTop";
import ScrollReveal from "@/components/ScrollReveal";
import I18nProvider from "@/components/I18nProvider";
import PWARegister from "@/components/PWARegister";
import { PWAInstallProvider } from "@/components/PWAInstallProvider";

import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title:
    "Institut National de la Poste, des Technologies de l'Information et de la Communication",

  description:
    "Portail numérique de l'INPTIC",

  icons: {
    icon: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {/* Capture le prompt PWA le plus tôt possible */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener("beforeinstallprompt", function(event) {
                console.warn(
                  "🔥 INPTIC : BEFOREINSTALLPROMPT REÇU PAR LE NAVIGATEUR"
                );

                event.preventDefault();

                window.__INPTIC_PWA_PROMPT__ = event;

                window.dispatchEvent(
                  new Event("inptic-pwa-prompt-ready")
                );
              });
            `,
          }}
        />

        <PWAInstallProvider>
          <I18nProvider>
            <PWARegister />

            <Header />

            {children}

            <Footer />

            <BackToTop />

            <ChatBot />

            <ScrollReveal />

            <Analytics />
          </I18nProvider>
        </PWAInstallProvider>
      </body>
    </html>
  );
}
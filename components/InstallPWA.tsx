 "use client";

import { useEffect, useState } from "react";
import { usePWAInstall } from "@/components/PWAInstallProvider";

type Device =
  | "android"
  | "iphone"
  | "ipad"
  | "windows"
  | "mac"
  | "linux"
  | "other";

function detectDevice(): Device {
  const ua = navigator.userAgent.toLowerCase();

  if (/android/.test(ua)) {
    return "android";
  }

  if (/iphone/.test(ua)) {
    return "iphone";
  }

  if (
    /ipad/.test(ua) ||
    (/macintosh/.test(ua) &&
      navigator.maxTouchPoints > 1)
  ) {
    return "ipad";
  }

  if (/windows/.test(ua)) {
    return "windows";
  }

  if (/macintosh|mac os x/.test(ua)) {
    return "mac";
  }

  if (/linux/.test(ua)) {
    return "linux";
  }

  return "other";
}

function getInstructions(device: Device) {
  switch (device) {
    case "android":
      return (
        <>
          <p>
            Ouvrez le menu de votre navigateur.
          </p>
          <p>
            Choisissez{" "}
            <strong>
              « Installer l’application »
            </strong>{" "}
            ou{" "}
            <strong>
              « Ajouter à l’écran d’accueil »
            </strong>
            .
          </p>
        </>
      );

    case "iphone":
    case "ipad":
      return (
        <>
          <p>
            Appuyez sur le bouton{" "}
            <strong>Partager</strong>.
          </p>
          <p>
            Choisissez ensuite{" "}
            <strong>
              « Sur l’écran d’accueil »
            </strong>
            .
          </p>
        </>
      );

    case "windows":
      return (
        <>
          <p>
            Utilisez l'option d'installation de votre
            navigateur pour ajouter INPTIC comme
            application.
          </p>
          <p>
            Une fois installée, INPTIC pourra être
            lancée depuis votre ordinateur.
          </p>
        </>
      );

    case "mac":
      return (
        <>
          <p>
            Utilisez l'option d'installation de votre
            navigateur pour ajouter INPTIC comme
            application.
          </p>
          <p>
            INPTIC pourra ensuite être lancée comme
            une application.
          </p>
        </>
      );

    case "linux":
      return (
        <>
          <p>
            Utilisez l'option d'installation de votre
            navigateur pour ajouter INPTIC comme
            application.
          </p>
          <p>
            Une fois installée, INPTIC apparaîtra
            comme une application web sur votre
            système.
          </p>
        </>
      );

    default:
      return (
        <p>
          Utilisez l'option d'installation proposée
          par votre navigateur pour ajouter INPTIC
          comme application.
        </p>
      );
  }
}

export default function InstallPWA() {
  const {
    install,
    isInstalled,
    canInstall,
  } = usePWAInstall();

  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] =
    useState(false);

  const [device, setDevice] =
    useState<Device>("other");

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleOpen = () => {
    setInstructions(false);
    setOpen(true);
  };

  const handleInstall = async () => {
    /*
     * Si le navigateur permet une installation
     * PWA programmatiquement, on la lance.
     */
    if (canInstall) {
      const installed = await install();

      if (installed) {
        setOpen(false);
      }

      return;
    }

    /*
     * Sinon, on garde notre propre interface INPTIC
     * et on affiche les instructions adaptées.
     */
    setInstructions(true);
  };

  return (
    <>
      {/* =====================================================
          BOUTON DU FOOTER
      ====================================================== */}

      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#c89d2c] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
        aria-label="Installer l'application INPTIC"
      >
        <span aria-hidden="true">📱</span>

        <span>
          Installer l'application INPTIC
        </span>
      </button>

      {/* =====================================================
          FENÊTRE D'INSTALLATION INPTIC
      ====================================================== */}

      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inptic-install-title"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Fermer */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950"
              aria-label="Fermer"
            >
              ✕
            </button>

            {/* =================================================
                EN-TÊTE
            ================================================== */}

            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 px-6 pb-8 pt-9 text-center text-white">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-xl">
                <img
                  src="/logoinptic.png"
                  alt="INPTIC"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <h2
                id="inptic-install-title"
                className="text-2xl font-bold"
              >
                Installer INPTIC
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-200">
                Installez le portail INPTIC comme
                une application sur votre appareil.
              </p>
            </div>

            {/* =================================================
                CONTENU
            ================================================== */}

            <div className="p-6">

              {!instructions ? (
                <>
                  <div className="mb-5 rounded-2xl bg-slate-50 p-5">
                    <div className="flex gap-4">

                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm"
                        aria-hidden="true"
                      >
                        📲
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          Application INPTIC
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Accédez rapidement à
                          l'INPTIC depuis votre appareil,
                          comme une application.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* =========================================
                      TOUJOURS UN BOUTON INSTALLER
                  ========================================== */}

                  <button
                    type="button"
                    onClick={handleInstall}
                    className="w-full rounded-xl bg-[#D4AF37] px-5 py-4 font-semibold text-slate-950 shadow-sm transition hover:bg-[#c89d2c] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  >
                    📲 Installer INPTIC
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-3 w-full rounded-xl px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    Plus tard
                  </button>
                </>
              ) : (
                <>
                  {/* =========================================
                      INSTRUCTIONS DE SECOURS
                  ========================================== */}

                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-slate-900">
                      Installation d'INPTIC
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Votre navigateur ne permet pas de
                      lancer automatiquement l'installation
                      depuis cette page.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                    <div className="space-y-3">
                      {getInstructions(device)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInstructions(false)}
                    className="mt-4 w-full rounded-xl bg-[#D4AF37] px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-[#c89d2c]"
                  >
                    ← Retour
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-2 w-full rounded-xl px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Fermer
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
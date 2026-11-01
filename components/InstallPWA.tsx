 "use client";

import { useEffect, useState } from "react";
import { usePWAInstall } from "@/components/PWAInstallProvider";

type Device =
  | "android"
  | "harmony"
  | "iphone"
  | "ipad"
  | "windows"
  | "mac"
  | "linux"
  | "other";

type Browser =
  | "chrome"
  | "edge"
  | "safari"
  | "samsung"
  | "huawei"
  | "firefox"
  | "other";

function detectDevice(): { device: Device; browser: Browser } {
  const ua = navigator.userAgent.toLowerCase();
  const browser: Browser = /edg\//.test(ua)
    ? "edge"
    : /samsungbrowser/.test(ua)
      ? "samsung"
      : /huawei.?browser/.test(ua)
        ? "huawei"
        : /firefox|fxios/.test(ua)
          ? "firefox"
          : /crios|chrome/.test(ua)
            ? "chrome"
            : /safari/.test(ua)
              ? "safari"
              : "other";

  if (/harmonyos/.test(ua)) return { device: "harmony", browser };
  if (/android/.test(ua)) {
    return { device: "android", browser };
  }

  if (/iphone/.test(ua)) {
    return { device: "iphone", browser };
  }

  if (
    /ipad/.test(ua) ||
    (/macintosh/.test(ua) &&
      navigator.maxTouchPoints > 1)
  ) {
    return { device: "ipad", browser };
  }

  if (/windows/.test(ua)) {
    return { device: "windows", browser };
  }

  if (/macintosh|mac os x/.test(ua)) {
    return { device: "mac", browser };
  }

  if (/linux/.test(ua)) {
    return { device: "linux", browser };
  }

  return { device: "other", browser };
}

function getInstructions(device: Device, browser: Browser) {
  switch (device) {
    case "android":
      if (browser === "samsung") {
        return (
          <>
            <p>Ouvrez le menu de Samsung Internet.</p>
            <p>
              Choisissez <strong>« Ajouter la page à »</strong>, puis{" "}
              <strong>« Écran d’accueil »</strong>.
            </p>
          </>
        );
      }
      return (
        <>
          <p>Ouvrez le menu ⋮ de votre navigateur.</p>
          <p>
            Touchez <strong>« Installer l’application »</strong> ou{" "}
            <strong>« Ajouter à l’écran d’accueil »</strong>, puis confirmez.
          </p>
        </>
      );

    case "harmony":
      return (
        <>
          <p>Ouvrez le menu de votre navigateur Huawei.</p>
          <p>
            Choisissez <strong>« Ajouter à l’écran d’accueil »</strong> ou{" "}
            <strong>« Ajouter un raccourci »</strong>, puis confirmez.
          </p>
        </>
      );

    case "iphone":
    case "ipad":
      return (
        <>
          <p>
            Dans Safari, appuyez sur <strong>Partager</strong> (le carré avec
            la flèche vers le haut).
          </p>
          <p>
            Faites défiler le menu, choisissez{" "}
            <strong>« Sur l’écran d’accueil »</strong>, puis <strong>Ajouter</strong>.
          </p>
        </>
      );

    case "windows":
    case "mac":
    case "linux":
      if (browser === "chrome" || browser === "edge") {
        return (
          <>
            <p>
              Cliquez sur l’icône <strong>Installer</strong> dans la barre
              d’adresse, si elle apparaît.
            </p>
            <p>
              Sinon, ouvrez le menu ⋮ et choisissez{" "}
              <strong>« Installer INPTIC »</strong> ou{" "}
              <strong>« Installer cette application »</strong>, puis confirmez.
            </p>
          </>
        );
      }
      if (device === "mac" && browser === "safari") {
        return (
          <>
            <p>Dans Safari, ouvrez le menu <strong>Fichier</strong>.</p>
            <p>
              Choisissez <strong>« Ajouter au Dock »</strong> pour créer
              l’application INPTIC.
            </p>
          </>
        );
      }
      return (
        <>
          <p>
            L’installation d’une application web dépend du navigateur. Ouvrez
            INPTIC dans <strong>Chrome ou Edge</strong> et utilisez son menu ⋮
            pour choisir l’option d’installation.
          </p>
        </>
      );

    default:
      return (
        <p>
          Ouvrez le menu de votre navigateur et recherchez{" "}
          <strong>« Installer l’application »</strong> ou{" "}
          <strong>« Ajouter à l’écran d’accueil »</strong>. Si l’option
          n’existe pas, essayez Chrome ou Edge.
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

  const [platform, setPlatform] = useState<{
    device: Device;
    browser: Browser;
  }>({ device: "other", browser: "other" });

  useEffect(() => {
    setPlatform(detectDevice());
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
                  src="/logoinptic.ico"
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
                      Si l’installation directe n’est pas proposée par ce
                      navigateur, suivez ces étapes pour ajouter INPTIC à votre
                      appareil.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                    <div className="space-y-3">
                      {getInstructions(platform.device, platform.browser)}
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
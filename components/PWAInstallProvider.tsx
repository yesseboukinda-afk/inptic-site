"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

declare global {
  interface Window {
    __INPTIC_PWA_PROMPT__?: BeforeInstallPromptEvent;
  }
}

interface PWAInstallContextType {
  install: () => Promise<boolean>;
  isInstalled: boolean;
  canInstall: boolean;
}

const PWAInstallContext =
  createContext<PWAInstallContextType | null>(null);

export function PWAInstallProvider({
  children,
}: {
  children: ReactNode;
}) {
  const promptRef =
    useRef<BeforeInstallPromptEvent | null>(null);

  const [canInstall, setCanInstall] =
    useState(false);

  const [isInstalled, setIsInstalled] =
    useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone =
        window.matchMedia(
          "(display-mode: standalone)"
        ).matches ||
        (
          window.navigator as Navigator & {
            standalone?: boolean;
          }
        ).standalone === true;

      setIsInstalled(standalone);
    };

    const capturePrompt = () => {
      const event =
        window.__INPTIC_PWA_PROMPT__;

      if (!event) {
        return;
      }

      promptRef.current = event;
      setCanInstall(true);
    };

    const onBeforeInstallPrompt = (
      event: Event
    ) => {
      event.preventDefault();

      const installEvent =
        event as BeforeInstallPromptEvent;

      promptRef.current = installEvent;

      window.__INPTIC_PWA_PROMPT__ =
        installEvent;

      setCanInstall(true);
    };

    const onAppInstalled = () => {
      promptRef.current = null;

      window.__INPTIC_PWA_PROMPT__ =
        undefined;

      setCanInstall(false);
      setIsInstalled(true);
    };

    checkInstalled();
    capturePrompt();

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt
    );

    window.addEventListener(
      "inptic-pwa-prompt-ready",
      capturePrompt
    );

    window.addEventListener(
      "appinstalled",
      onAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt
      );

      window.removeEventListener(
        "inptic-pwa-prompt-ready",
        capturePrompt
      );

      window.removeEventListener(
        "appinstalled",
        onAppInstalled
      );
    };
  }, []);

  const install = async () => {
    const event = promptRef.current;

    if (!event) {
      return false;
    }

    try {
      await event.prompt();

      const result =
        await event.userChoice;

      promptRef.current = null;

      window.__INPTIC_PWA_PROMPT__ =
        undefined;

      setCanInstall(false);

      return result.outcome === "accepted";
    } catch (error) {
      console.error(
        "INPTIC PWA : erreur d'installation",
        error
      );

      return false;
    }
  };

  return (
    <PWAInstallContext.Provider
      value={{
        install,
        isInstalled,
        canInstall,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const context =
    useContext(PWAInstallContext);

  if (!context) {
    throw new Error(
      "usePWAInstall doit être utilisé à l'intérieur de PWAInstallProvider"
    );
  }

  return context;
}
"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registrations =
          await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          await registration.unregister();
        }

        const cacheNames =
          await caches.keys();

        await Promise.all(
          cacheNames
            .filter((name) =>
              name.startsWith("inptic-pwa-")
            )
            .map((name) =>
              caches.delete(name)
            )
        );

        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

        console.warn(
          "✅ INPTIC PWA : Service Worker enregistré",
          registration.scope
        );
      } catch (error) {
        console.error(
          "❌ INPTIC PWA : erreur Service Worker",
          error
        );
      }
    };

    register();
  }, []);

  return null;
}
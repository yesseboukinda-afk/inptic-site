'use client';

import { useEffect, useState } from 'react';

export default function useDarkTheme(enabled = true) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    const updateTheme = () => setIsDarkTheme(root.classList.contains('dark'));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [enabled]);

  return isDarkTheme;
}

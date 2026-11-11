'use client';

import { Lottie } from 'lottie-react';
import { useEffect, useState } from 'react';
import useDarkTheme from './useDarkTheme';
import animation from './library/assets/library-loading.json';

type Props = {
  label?: string;
  size?: number;
  mode?: 'loading' | 'success';
};

export default function StatusAnimation({
  label = 'Chargement en cours',
  size = 112,
  mode = 'loading',
}: Props) {
  const isDarkTheme = useDarkTheme();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduceMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  return (
    <div
      className={`site-status-animation site-status-animation-${mode} grid place-items-center`}
      style={{ filter: isDarkTheme ? 'invert(1)' : undefined }}
    >
      <div role="status" aria-live="polite">
        <Lottie
          src={animation}
          autoplay={!reduceMotion}
          loop={!reduceMotion && mode === 'loading'}
          aria-hidden="true"
          style={{ width: size, height: size }}
        />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

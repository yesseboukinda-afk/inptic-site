'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 180;

      if (shouldShow) {
        setVisible(true);
      }

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }

      if (!shouldShow) {
        setVisible(false);
        return;
      }

      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 1400);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setVisible(false);
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Retour en haut"
      title="Retour en haut"
      className={[
        'fixed bottom-20 right-4 z-[60] inline-flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 sm:right-6 md:bottom-6 md:right-20',
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      ].join(' ')}
      style={{ width: 46, height: 46 }}
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}

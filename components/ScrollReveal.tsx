'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const selector = 'section, article, .rounded-2xl, .rounded-3xl, .feature-card, .stat-card, [data-reveal]';
    const nodes = Array.from(document.querySelectorAll(selector));

    nodes.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.classList.remove('is-visible');
        element.setAttribute('data-reveal', 'true');
      }
    });

    const elements = nodes.filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DeleteButtonProps {
  onDelete: () => void | Promise<void>;
  label?: string;
  className?: string;
  disabled?: boolean;
  /** Message de confirmation avant suppression. Mettre `null` pour désactiver. */
  confirmMessage?: string | null;
  /** Appelé si onDelete échoue (pour afficher un toast, par exemple). */
  onError?: (error: unknown) => void;
}

const LETTER_DURATION_MS = 750; // doit correspondre à l'animation CSS
const LETTER_STAGGER_MS = 50;

export default function DeleteButton({
  onDelete,
  label = 'Supprimer',
  className = '',
  disabled = false,
  confirmMessage = 'Cette action est irréversible. Continuer ?',
  onError,
}: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const letters = Array.from(label);

  // Durée réelle de l'animation : la dernière lettre part avec (n-1) * décalage
  const totalAnimationMs =
    LETTER_DURATION_MS + Math.max(letters.length - 1, 0) * LETTER_STAGGER_MS;

  const handleClick = async () => {
    if (isDeleting || disabled) return;

    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setIsDeleting(true);

    try {
      // La suppression réelle et l'animation tournent en parallèle :
      // on attend les deux, sans délai artificiel supplémentaire.
      await Promise.all([
        Promise.resolve(onDelete()),
        new Promise<void>((resolve) => setTimeout(resolve, totalAnimationMs)),
      ]);
    } catch (error) {
      onError?.(error);
    } finally {
      // Évite de modifier l'état si le bouton a disparu (élément supprimé de la liste)
      if (isMounted.current) setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      aria-busy={isDeleting}
      aria-disabled={disabled || isDeleting}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-300 hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-red-600 ${
        isDeleting ? 'pointer-events-none' : ''
      } ${className}`}
    >
      {/* Icône corbeille */}
      <span
        aria-hidden="true"
        className={`relative transition-transform duration-300 ${
          isDeleting
            ? '-translate-y-1 rotate-12 scale-125 text-amber-200'
            : 'group-hover:-translate-y-0.5'
        }`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </span>

      {/* Texte : lettres masquées aux lecteurs d'écran (le aria-label suffit) */}
      <span aria-hidden="true" className="relative inline-flex items-center">
        {letters.map((char, index) => {
          const flyDist = 40 + index * 10;
          const rot = (index % 2 === 0 ? 1 : -1) * (25 + index * 6);
          return (
            <span
              key={index}
              className={`inline-block ${isDeleting ? 'fly-letter' : ''}`}
              style={
                isDeleting
                  ? ({
                      position: 'relative',
                      zIndex: 20,
                      '--fly-dist': `${flyDist}px`,
                      '--rot': `${rot}deg`,
                      animationDelay: `${index * LETTER_STAGGER_MS}ms`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </span>

      <style jsx>{`
        @keyframes flyUp {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          40% {
            transform: translateY(calc(-1 * var(--fly-dist, 50px)))
              rotate(var(--rot, 15deg)) scale(1.15);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(-1 * var(--fly-dist, 50px) - 30px))
              rotate(calc(2 * var(--rot, 15deg))) scale(0);
            opacity: 0;
          }
        }

        .fly-letter {
          animation: flyUp ${LETTER_DURATION_MS}ms cubic-bezier(0.25, 1, 0.5, 1)
            forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .fly-letter {
            animation: none;
            opacity: 0.6;
          }
        }
      `}</style>
    </button>
  );
}
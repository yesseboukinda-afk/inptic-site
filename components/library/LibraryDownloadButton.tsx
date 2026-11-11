'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import StatusAnimation from '../StatusAnimation';
import useDarkTheme from '../useDarkTheme';

type Props = {
  href: string;
  filename: string;
  title: string;
  className: string;
  children: ReactNode;
  'aria-label'?: string;
};

function responseFilename(disposition: string | null, fallback: string) {
  const encodedName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  return encodedName ? decodeURIComponent(encodedName) : fallback;
}

export default function LibraryDownloadButton({
  href,
  filename,
  title,
  className,
  children,
  'aria-label': ariaLabel,
}: Props) {
  const controllerRef = useRef<AbortController | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState('');
  const isDarkTheme = useDarkTheme(downloading || downloadSuccess);

  useEffect(() => () => {
    if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current);
    controllerRef.current?.abort();
  }, []);

  const downloadBook = async () => {
    if (controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setDownloading(true);
    setDownloadSuccess(false);
    setError('');

    try {
      const response = await fetch(href, { signal: controller.signal });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Impossible de télécharger ce livre.');
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('Le fichier reçu n’est pas un PDF valide.');
      }

      const file = await response.blob();
      const objectUrl = URL.createObjectURL(file);
      const anchor = window.document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = responseFilename(response.headers.get('content-disposition'), filename);
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setDownloadSuccess(true);
      successTimerRef.current = window.setTimeout(() => {
        setDownloadSuccess(false);
        successTimerRef.current = null;
      }, 1800);
    } catch (downloadError) {
      if (!(downloadError instanceof Error && downloadError.name === 'AbortError')) {
        setError(downloadError instanceof Error ? downloadError.message : 'Impossible de télécharger ce livre.');
      }
    } finally {
      controllerRef.current = null;
      setDownloading(false);
    }
  };

  const cancelDownload = () => controllerRef.current?.abort();

  return (
    <>
      <button
        type="button"
        onClick={() => void downloadBook()}
        disabled={downloading}
        aria-label={ariaLabel}
        aria-busy={downloading}
        className={`${className} disabled:cursor-wait disabled:opacity-70`}
      >
        {children}
      </button>
      {typeof window !== 'undefined' && (downloading || downloadSuccess || error) && createPortal(
        <>
          {(downloading || downloadSuccess) && (
            <div
              className="library-download-overlay fixed inset-0 z-[100] grid place-items-center p-6 backdrop-blur-sm"
              style={{
                backgroundColor: isDarkTheme ? 'rgb(2 6 23 / 92%)' : 'rgb(255 255 255 / 92%)',
                color: isDarkTheme ? '#f8fafc' : '#0f172a',
              }}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <StatusAnimation
                  label={downloadSuccess ? `Téléchargement de ${title} terminé` : `Téléchargement de ${title}`}
                  size={144}
                  mode={downloadSuccess ? 'success' : 'loading'}
                />
                <p className="max-w-md text-sm font-semibold">
                  {downloadSuccess ? `Téléchargement de « ${title} » terminé.` : `Téléchargement de « ${title} »…`}
                </p>
                {downloading && (
                  <button
                    type="button"
                    onClick={cancelDownload}
                    className="inline-flex items-center gap-2 border border-current/40 px-4 py-2 text-sm hover:bg-current/10"
                  >
                    <X size={15} aria-hidden="true" /> Annuler
                  </button>
                )}
              </div>
            </div>
          )}
          {error && (
            <div className="fixed left-1/2 top-4 z-[110] flex w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 items-start justify-between gap-4 border border-red-300 bg-red-950 p-4 text-sm text-red-100 shadow-xl" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} aria-label="Fermer le message d’erreur">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </>,
        window.document.body,
      )}
    </>
  );
}

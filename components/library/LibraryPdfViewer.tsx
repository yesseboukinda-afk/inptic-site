'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';

type LibraryPdfViewerProps = {
  src: string;
  page: number;
  onPageChange: (page: number) => void;
  onPageCountChange: (pageCount: number) => void;
};

export default function LibraryPdfViewer({
  src,
  page,
  onPageChange,
  onPageCountChange,
}: LibraryPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayedPage, setDisplayedPage] = useState(page);
  const [frontIndex, setFrontIndex] = useState(0);
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const [readyPage, setReadyPage] = useState<number | null>(null);
  const [turning, setTurning] = useState(false);

  useEffect(() => {
    let active = true;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    setLoading(true);
    setError('');
    setDocument(null);

    void import('pdfjs-dist')
      .then(({ getDocument, GlobalWorkerOptions }) => {
        if (!active) return;
        GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        loadingTask = getDocument({ url: src, withCredentials: true });
        return loadingTask.promise;
      })
      .then((pdf) => {
        if (!active || !pdf) return;
        setDocument(pdf);
        onPageCountChange(pdf.numPages);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Impossible d’ouvrir ce document.');
        setLoading(false);
      });

    return () => {
      active = false;
      if (loadingTask) void loadingTask.destroy();
    };
  }, [src, onPageCountChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => setContainerWidth(container.clientWidth);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!document || !containerWidth) return;
    let active = true;
    let pageProxy: PDFPageProxy | undefined;
    let renderTask: RenderTask | undefined;

    const canvas = canvasRefs[frontIndex].current;
    if (!canvas) return;

    void document.getPage(displayedPage)
      .then((loadedPage) => {
        if (!active) return;
        pageProxy = loadedPage;
        const baseViewport = loadedPage.getViewport({ scale: 1 });
        const fitScale = Math.min((containerWidth - 24) / baseViewport.width, 1.5);
        const viewport = loadedPage.getViewport({ scale: Math.max(fitScale, 0.1) * zoom });
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Le navigateur ne peut pas afficher cette page PDF.');

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        renderTask = loadedPage.render({
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        return renderTask.promise;
      })
      .catch((renderError: unknown) => {
        if (!active || (renderError instanceof Error && renderError.name === 'RenderingCancelledException')) return;
        setError(renderError instanceof Error ? renderError.message : 'Impossible d’afficher cette page.');
      });

    return () => {
      active = false;
      renderTask?.cancel();
      pageProxy?.cleanup();
    };
  }, [document, displayedPage, frontIndex, containerWidth, zoom]);

  useEffect(() => {
    if (!document || page === displayedPage) return;
    setPendingPage(page);
    setReadyPage(null);
    setTurning(false);
  }, [document, page, displayedPage]);

  useEffect(() => {
    if (!document || pendingPage === null || !containerWidth) return;
    let active = true;
    let pageProxy: PDFPageProxy | undefined;
    let renderTask: RenderTask | undefined;
    const canvas = canvasRefs[1 - frontIndex].current;
    if (!canvas) return;

    void document.getPage(pendingPage)
      .then((loadedPage) => {
        if (!active) return;
        pageProxy = loadedPage;
        const baseViewport = loadedPage.getViewport({ scale: 1 });
        const fitScale = Math.min((containerWidth - 24) / baseViewport.width, 1.5);
        const viewport = loadedPage.getViewport({ scale: Math.max(fitScale, 0.1) * zoom });
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Le navigateur ne peut pas afficher cette page PDF.');

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        renderTask = loadedPage.render({
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        return renderTask.promise;
      })
      .then(() => {
        if (active) setReadyPage(pendingPage);
      })
      .catch((renderError: unknown) => {
        if (!active || (renderError instanceof Error && renderError.name === 'RenderingCancelledException')) return;
        setError(renderError instanceof Error ? renderError.message : 'Impossible d’afficher cette page.');
      });

    return () => {
      active = false;
      renderTask?.cancel();
      pageProxy?.cleanup();
    };
  }, [document, pendingPage, frontIndex, containerWidth, zoom]);

  useEffect(() => {
    if (pendingPage !== null && readyPage === pendingPage) setTurning(true);
  }, [pendingPage, readyPage]);

  const completePageTurn = () => {
    if (!turning || pendingPage === null) return;
    setDisplayedPage(pendingPage);
    setFrontIndex((current) => 1 - current);
    setPendingPage(null);
    setReadyPage(null);
    setTurning(false);
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-3 pb-8 sm:px-6" aria-label="Lecteur PDF">
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={loading || turning || pendingPage !== null || page <= 1}
          className="inline-flex min-h-11 items-center gap-1 border border-white/20 px-3 text-sm font-semibold text-white disabled:opacity-40"
          aria-label="Page précédente"
        >
          <ChevronLeft size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Précédente</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((current) => Math.max(0.75, Math.round((current - 0.25) * 100) / 100))}
            disabled={loading || turning || pendingPage !== null || zoom <= 0.75}
            className="grid size-11 place-items-center border border-white/20 text-white disabled:opacity-40"
            aria-label="Réduire le zoom"
          >
            <ZoomOut size={18} aria-hidden="true" />
          </button>
          <span className="min-w-12 text-center text-xs text-slate-300">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.min(2.5, Math.round((current + 0.25) * 100) / 100))}
            disabled={loading || turning || pendingPage !== null || zoom >= 2.5}
            className="grid size-11 place-items-center border border-white/20 text-white disabled:opacity-40"
            aria-label="Agrandir le zoom"
          >
            <ZoomIn size={18} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(document?.numPages ?? page, page + 1))}
          disabled={loading || turning || pendingPage !== null || !document || page >= document.numPages}
          className="inline-flex min-h-11 items-center gap-1 border border-white/20 px-3 text-sm font-semibold text-white disabled:opacity-40"
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivante</span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {error ? (
        <p role="alert" className="border border-red-300/30 bg-red-950 p-4 text-sm text-red-100">
          Impossible d’afficher ce livre : {error}
        </p>
      ) : (
        <div
          ref={containerRef}
          className="library-pdf-page-stage grid min-h-[55vh] w-full place-items-start overflow-auto bg-slate-800 p-3"
          aria-busy={loading || pendingPage !== null}
        >
          {loading && (
            <div className="col-start-1 row-start-1 grid min-h-[55vh] w-full place-items-center">
              <LoaderCircle className="animate-spin text-cyan-300" size={32} aria-label="Chargement de la page" />
            </div>
          )}
          {canvasRefs.map((canvasRef, index) => {
            const isFront = index === frontIndex;
            const isVisible = isFront ? !loading : turning;
            const turnClass = isFront && turning
              ? page > displayedPage
                ? 'library-pdf-page-turn-forward'
                : 'library-pdf-page-turn-backward'
              : '';

            return (
              <canvas
                key={index}
                ref={canvasRef}
                className={`library-pdf-page-canvas col-start-1 row-start-1 mx-auto max-w-none ${turnClass} ${isVisible ? 'visible' : 'invisible'}`}
                style={{ zIndex: isFront ? 2 : 1 }}
                onAnimationEnd={isFront ? completePageTurn : undefined}
                aria-label={`Page ${isFront ? displayedPage : pendingPage ?? page}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

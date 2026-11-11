'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import StatusAnimation from '../StatusAnimation';

type LibraryPdfViewerProps = {
  src: string;
  page: number;
  onPageChange: (page: number) => void;
  onPageCountChange: (pageCount: number) => void;
};

type PageTransition = {
  incoming: number;
  outgoing: number;
  direction: 1 | -1;
  phase: 'prepare' | 'running';
};

export default function LibraryPdfViewer({
  src,
  page,
  onPageChange,
  onPageCountChange,
}: LibraryPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const frontIndexRef = useRef(0);
  const renderedPageRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<1 | -1>(1);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [availablePageHeight, setAvailablePageHeight] = useState(0);
  const [pageStageWidth, setPageStageWidth] = useState<number | null>(null);
  const [pageStageHeight, setPageStageHeight] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [frontIndex, setFrontIndex] = useState(0);
  const [renderedPage, setRenderedPage] = useState<number | null>(null);
  const [pageTransition, setPageTransition] = useState<PageTransition | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    setLoading(true);
    setError('');
    setDocument(null);
    setRenderedPage(null);
    setPageStageWidth(null);
    setPageStageHeight(null);
    renderedPageRef.current = null;
    frontIndexRef.current = 0;
    setFrontIndex(0);
    lastDirectionRef.current = 1;
    setPageTransition(null);

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

    const measure = () => {
      setContainerWidth(container.clientWidth);
      setAvailablePageHeight(Math.max(window.innerHeight * 0.6, 240));
    };
    measure();
    window.addEventListener('resize', measure);
    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduceMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (!pageTransition || pageTransition.phase !== 'prepare') return;
    const frame = window.requestAnimationFrame(() => {
      setPageTransition((current) => current?.incoming === pageTransition.incoming
        ? { ...current, phase: 'running' }
        : current);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pageTransition]);

  useEffect(() => {
    if (!document || !containerWidth || !availablePageHeight) return;
    let active = true;
    let pageProxy: PDFPageProxy | undefined;
    let renderTask: RenderTask | undefined;

    const previousPage = renderedPageRef.current;
    const outgoingIndex = frontIndexRef.current;
    const canvasIndex = previousPage === null ? outgoingIndex : 1 - outgoingIndex;
    setPageTransition(null);
    const canvas = canvasRefs[canvasIndex].current;
    if (!canvas) return;

    void document.getPage(page)
      .then((loadedPage) => {
        if (!active) return;
        pageProxy = loadedPage;
        const baseViewport = loadedPage.getViewport({ scale: 1 });
        const fitScale = Math.min(
          Math.max(containerWidth, 1) / baseViewport.width,
          availablePageHeight / baseViewport.height,
          1.5,
        );
        const viewport = loadedPage.getViewport({ scale: Math.max(fitScale, 0.1) * zoom });
        setPageStageWidth(viewport.width);
        setPageStageHeight(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Le navigateur ne peut pas afficher cette page PDF.');

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
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
        if (!active) return;
        frontIndexRef.current = canvasIndex;
        setFrontIndex(canvasIndex);
        renderedPageRef.current = page;
        setRenderedPage(page);
        if (previousPage !== null && page !== previousPage) {
          const direction = page > previousPage ? 1 : -1;
          lastDirectionRef.current = direction;
          setPageTransition({
            incoming: canvasIndex,
            outgoing: outgoingIndex,
            direction,
            phase: 'prepare',
          });
        }
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
  }, [document, page, containerWidth, availablePageHeight, zoom]);

  return (
    <section className="mx-auto w-full max-w-5xl px-3 pb-8 sm:px-6" aria-label="Lecteur PDF">
      <div className="mb-3 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((current) => Math.max(0.75, Math.round((current - 0.25) * 100) / 100))}
            disabled={loading || !document || zoom <= 0.75}
            className="grid size-11 place-items-center border border-white/20 text-white disabled:opacity-40"
            aria-label="Réduire le zoom"
          >
            <ZoomOut size={18} aria-hidden="true" />
          </button>
          <span className="min-w-12 text-center text-xs text-slate-300">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.min(2.5, Math.round((current + 0.25) * 100) / 100))}
            disabled={loading || !document || zoom >= 2.5}
            className="grid size-11 place-items-center border border-white/20 text-white disabled:opacity-40"
            aria-label="Agrandir le zoom"
          >
            <ZoomIn size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="border border-red-300/30 bg-red-950 p-4 text-sm text-red-100">
          Impossible d’afficher ce livre : {error}
        </p>
      ) : (
        <div
          ref={containerRef}
          className="flex w-full justify-center overflow-x-auto overflow-y-hidden"
          style={{
            minHeight: pageStageHeight ? undefined : '55vh',
          }}
          aria-busy={loading || !document || renderedPage !== page}
        >
          <div
            className="library-pdf-page-stage relative shrink-0 overflow-hidden bg-slate-800"
            style={{
              width: pageStageWidth ? `${pageStageWidth}px` : '100%',
              height: pageStageHeight ? `${pageStageHeight}px` : '55vh',
            }}
          >
            {(loading || !document || renderedPage !== page) && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/75">
                <StatusAnimation label={`Chargement de la page ${page}`} />
              </div>
            )}
            {canvasRefs.map((canvasRef, index) => {
              const isFront = index === frontIndex;
              const isIncoming = pageTransition?.incoming === index;
              const isOutgoing = pageTransition?.outgoing === index;
              const isSliding = pageTransition?.phase === 'running' && (isIncoming || isOutgoing);
              const slideOffset = pageTransition
                ? isIncoming
                  ? pageTransition.phase === 'prepare' ? pageTransition.direction : 0
                  : isOutgoing
                    ? pageTransition.phase === 'prepare' ? 0 : -pageTransition.direction
                    : 0
                : isFront ? 0 : -lastDirectionRef.current;
              return (
                <canvas
                  key={index}
                  ref={canvasRef}
                  className={`library-pdf-page-canvas absolute left-1/2 top-0 max-w-none ${isFront ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    zIndex: isFront ? 2 : 1,
                    display: isFront || isIncoming || isOutgoing ? 'block' : 'none',
                    transform: `translateX(calc(-50% + ${slideOffset * 100}%))`,
                    transition: isSliding
                      ? `transform ${reduceMotion ? '1ms' : '360ms'} cubic-bezier(0.22, 1, 0.36, 1)`
                      : 'none',
                  }}
                  aria-hidden={!isFront}
                  aria-label={isFront ? `Page ${renderedPage ?? page}` : undefined}
                  onClick={(event) => {
                    if (!isFront || !document) return;
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const clickPosition = (event.clientX - bounds.left) / bounds.width;
                    if (clickPosition <= 0.2 && page > 1) onPageChange(page - 1);
                    else if (clickPosition >= 0.8 && page < document.numPages) onPageChange(page + 1);
                  }}
                  onTransitionEnd={(event) => {
                    if (event.propertyName === 'transform' && isIncoming) setPageTransition(null);
                  }}
                />
              );
            })}
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={loading || !document || page <= 1}
              className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center border border-white/30 bg-slate-950/65 text-white shadow transition-colors hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-30"
              aria-label="Page précédente"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(document?.numPages ?? page, page + 1))}
              disabled={loading || !document || page >= document.numPages}
              className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center border border-white/30 bg-slate-950/65 text-white shadow transition-colors hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-30"
              aria-label="Page suivante"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      {page > 1 && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          aria-label="Retour à la première page"
          title="Retour à la première page"
          className="fixed right-4 z-[60] inline-flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          style={{ width: 46, height: 46, bottom: 144 }}
        >
          <ChevronsLeft size={20} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

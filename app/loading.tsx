export default function Loading() {
  return (
    <main
      className="container-x flex min-h-[50vh] items-center justify-center"
      aria-busy="true"
    >
      <p className="sr-only" aria-live="polite">
        Chargement de la page...
      </p>
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
        aria-hidden="true"
      />
    </main>
  );
}

export default function Loading() {
  return (
    <main className="app-shell" aria-label="Cargando cartera">
      <div className="skeleton skeleton-header" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton skeleton-chart" />
      </div>
      <div className="skeleton skeleton-list" />
    </main>
  );
}

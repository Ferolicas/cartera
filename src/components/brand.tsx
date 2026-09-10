import { WalletCards } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Mi Cartera">
      <span className="brand-mark" aria-hidden="true">
        <WalletCards size={20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>Mi Cartera</strong>
          <small>Finanzas personales</small>
        </span>
      )}
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle, X } from "lucide-react";
import { amountToCents, centsToInput } from "@/lib/money";
import type {
  BettingTransactionItem,
  BettingTransactionType,
} from "@/types/betting";

export type BettingTransactionDraft = {
  description: string;
  amountCents: number;
  type: BettingTransactionType;
  dueDate: string;
  status: "pending" | "settled";
};

export function BettingModal({
  item,
  initialType,
  initialDate,
  onClose,
  onSave,
}: {
  item?: BettingTransactionItem;
  initialType: BettingTransactionType;
  initialDate: string;
  onClose: () => void;
  onSave: (draft: BettingTransactionDraft) => Promise<void>;
}) {
  const [type, setType] = useState<BettingTransactionType>(
    item?.type ?? initialType,
  );
  const [description, setDescription] = useState(item?.description ?? "");
  const [amount, setAmount] = useState(
    item ? centsToInput(item.amountCents) : "",
  );
  const [dueDate, setDueDate] = useState(item?.dueDate ?? initialDate);
  const [status, setStatus] = useState<"pending" | "settled">(
    item?.status ?? "pending",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await onSave({
        description: description.trim(),
        amountCents: amountToCents(amount),
        type,
        dueDate,
        status,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="betting-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="modal-kicker">
              {item ? "Editar" : "Nuevo movimiento de apuestas"}
            </p>
            <h2 id="betting-modal-title">
              {item ? "Actualiza el movimiento" : "Registra en tus apuestas"}
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form className="transaction-form" onSubmit={submit}>
          <fieldset className="type-choice">
            <legend>Tipo de movimiento</legend>
            <button
              type="button"
              className={type === "income" ? "active income" : ""}
              onClick={() => setType("income")}
              aria-pressed={type === "income"}
            >
              <ArrowUpRight size={18} /> Ingreso
            </button>
            <button
              type="button"
              className={type === "withdrawal" ? "active expense" : ""}
              onClick={() => setType("withdrawal")}
              aria-pressed={type === "withdrawal"}
            >
              <ArrowDownLeft size={18} /> Retirada
            </button>
          </fieldset>

          <label className="field-label" htmlFor="description">
            Concepto
            <input
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={160}
              placeholder={
                type === "income"
                  ? "Ej. Depósito Bet365"
                  : "Ej. Retirada ganancias Champions"
              }
              autoFocus
              required
            />
          </label>

          <div className="form-row">
            <label className="field-label" htmlFor="amount">
              Importe
              <span className="money-input">
                <span>€</span>
                <input
                  id="amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="0,00"
                  required
                />
              </span>
            </label>
            <label className="field-label" htmlFor="dueDate">
              Fecha {type === "income" ? "del ingreso" : "de la retirada"}
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                required
              />
            </label>
          </div>

          <label className="field-label" htmlFor="status">
            Estado
            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "pending" | "settled")
              }
            >
              <option value="pending">Pendiente</option>
              <option value="settled">
                {type === "income" ? "Ingresado" : "Retirado / Cobrado"}
              </option>
            </select>
          </label>

          <div className="form-error modal-error" aria-live="polite">
            {error}
          </div>
          <div className="modal-actions">
            <button
              className="button-secondary"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="button-primary" type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={18} /> : null}
              {saving
                ? "Guardando..."
                : item
                  ? "Guardar cambios"
                  : "Añadir movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

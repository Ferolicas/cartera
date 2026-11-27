"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Dices,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import {
  BettingModal,
  type BettingTransactionDraft,
} from "@/components/betting-modal";
import { dateRangeForPeriod, type Period } from "@/lib/periods";
import type {
  BettingSummary,
  BettingTransactionItem,
  BettingTransactionType,
} from "@/types/betting";

type ViewType = "all" | BettingTransactionType;
type Range = { start: string; end: string };
type ModalState =
  | { type: BettingTransactionType; item?: undefined }
  | { type: BettingTransactionType; item: BettingTransactionItem };

const periodLabels: Record<Period, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
  quarter: "Trimestre",
  year: "Año",
};

const moneyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

function money(cents?: number) {
  return cents === undefined ? "—" : moneyFormatter.format(cents / 100);
}

class SessionExpiredError extends Error {}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (response.status === 401) {
    throw new SessionExpiredError("La sesión ha caducado");
  }
  if (!response.ok) {
    throw new Error(data.error || "No se pudo completar la operación");
  }
  return data;
}

function shiftDate(anchor: string, period: Period, direction: -1 | 1) {
  const date = parseISO(anchor);
  const next =
    period === "day"
      ? addDays(date, direction)
      : period === "week"
        ? addWeeks(date, direction)
        : period === "month"
          ? addMonths(date, direction)
          : period === "quarter"
            ? addQuarters(date, direction)
            : addYears(date, direction);
  return format(next, "yyyy-MM-dd");
}

function rangeTitle(range: Range, period: Period) {
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  if (period === "day")
    return format(start, "EEEE, d 'de' MMMM", { locale: es });
  if (period === "month")
    return format(start, "MMMM 'de' yyyy", { locale: es });
  if (period === "quarter") {
    const quarter = Math.floor(start.getMonth() / 3) + 1;
    return `${quarter}.º trimestre de ${start.getFullYear()}`;
  }
  if (period === "year") return String(start.getFullYear());
  return `${format(start, "d MMM", { locale: es })} — ${format(end, "d MMM yyyy", { locale: es })}`;
}

export function BettingDashboard({ initialDate }: { initialDate: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<BettingSummary | null>(null);
  const [items, setItems] = useState<BettingTransactionItem[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [viewType, setViewType] = useState<ViewType>("all");
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [range, setRange] = useState<Range>(() =>
    dateRangeForPeriod(initialDate, "month"),
  );
  const [loadingItems, setLoadingItems] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadSummary(date: string = anchorDate) {
    const nextSummary = await api<BettingSummary>(
      `/api/betting/dashboard?date=${date}`,
    );
    setSummary(nextSummary);
  }

  async function loadItems() {
    const query = new URLSearchParams({
      period,
      date: anchorDate,
      type: viewType,
    });
    const result = await api<{
      items: BettingTransactionItem[];
      range: Range;
    }>(`/api/betting/transactions?${query}`);
    setItems(result.items);
    setRange(result.range);
  }

  useEffect(() => {
    let active = true;
    api<BettingSummary>(`/api/betting/dashboard?date=${anchorDate}`)
      .then((nextSummary) => {
        if (!active) return;
        setSummary(nextSummary);
      })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof SessionExpiredError) router.replace("/login");
        else setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [anchorDate, router]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      period,
      date: anchorDate,
      type: viewType,
    });
    api<{ items: BettingTransactionItem[]; range: Range }>(
      `/api/betting/transactions?${query}`,
    )
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setRange(result.range);
      })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof SessionExpiredError) router.replace("/login");
        else setError(cause.message);
      })
      .finally(() => active && setLoadingItems(false));
    return () => {
      active = false;
    };
  }, [anchorDate, period, router, viewType]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredTotals = useMemo(
    () =>
      items.reduce(
        (total, item) => {
          total[item.type] += item.amountCents;
          return total;
        },
        { income: 0, withdrawal: 0 },
      ),
    [items],
  );

  const filteredNet = filteredTotals.withdrawal - filteredTotals.income;

  async function refreshAll() {
    await Promise.all([loadSummary(anchorDate), loadItems()]);
  }

  function reportError(cause: unknown, fallback: string) {
    if (cause instanceof SessionExpiredError) {
      router.replace("/login");
      return;
    }
    setError(cause instanceof Error ? cause.message : fallback);
  }

  function selectPeriod(value: Period) {
    if (value === period) return;
    setLoadingItems(true);
    setError("");
    setPeriod(value);
  }

  function selectViewType(value: ViewType) {
    if (value === viewType) return;
    setLoadingItems(true);
    setError("");
    setViewType(value);
  }

  function selectAnchorDate(value: string) {
    if (!value || value === anchorDate) return;
    setLoadingItems(true);
    setError("");
    setAnchorDate(value);
  }

  async function saveTransaction(draft: BettingTransactionDraft) {
    const editing = modal?.item;
    await api(
      editing
        ? `/api/betting/transactions/${editing.id}`
        : "/api/betting/transactions",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      },
    );
    setModal(null);
    await refreshAll();
    setNotice(editing ? "Movimiento actualizado" : "Movimiento añadido");
  }

  async function toggleStatus(item: BettingTransactionItem) {
    setBusyId(item.id);
    setError("");
    try {
      await api(`/api/betting/transactions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: item.status === "pending" ? "settled" : "pending",
        }),
      });
      await refreshAll();
      setNotice(
        item.status === "pending"
          ? "Movimiento completado"
          : "Movimiento reabierto",
      );
    } catch (cause) {
      reportError(cause, "No se pudo actualizar");
    } finally {
      setBusyId("");
    }
  }

  async function removeTransaction(item: BettingTransactionItem) {
    if (
      !window.confirm(
        `¿Eliminar “${item.description}”? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setBusyId(item.id);
    setError("");
    try {
      await api(`/api/betting/transactions/${item.id}`, { method: "DELETE" });
      await refreshAll();
      setNotice("Movimiento eliminado");
    } catch (cause) {
      reportError(cause, "No se pudo eliminar");
    } finally {
      setBusyId("");
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Brand />

        <nav className="section-nav" aria-label="Secciones">
          <Link href="/" className="section-nav-link">
            <Wallet size={16} /> <span>Cartera</span>
          </Link>
          <Link href="/apuestas" className="section-nav-link active">
            <Dices size={16} /> <span>Apuestas</span>
          </Link>
        </nav>

        <div className="header-actions">
          <div className="today-label">
            <CalendarDays size={16} />
            <span>
              {format(parseISO(initialDate), "d MMM yyyy", { locale: es })}
            </span>
          </div>
          <button className="logout-button" type="button" onClick={logout}>
            <LogOut size={17} /> <span>Salir</span>
          </button>
        </div>
      </header>

      <main className="app-shell">
        <section className="welcome-row">
          <div>
            <p className="section-kicker">Control de apuestas</p>
            <h1>Tus apuestas, claro y al día.</h1>
          </div>
          <div className="quick-actions">
            <button
              className="quick-button expense-button"
              type="button"
              onClick={() => setModal({ type: "income" })}
            >
              <Plus size={17} /> Añadir ingreso
            </button>
            <button
              className="quick-button income-button"
              type="button"
              onClick={() => setModal({ type: "withdrawal" })}
            >
              <Plus size={17} /> Añadir retirada
            </button>
          </div>
        </section>

        {error && (
          <div className="alert-error" role="alert">
            {error}
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Cerrar aviso"
            >
              ×
            </button>
          </div>
        )}

        <section className="overview-grid">
          {/* Card 1: Neto Total General */}
          <article className="balance-card">
            <div className="balance-card-top">
              <div>
                <span className="balance-label">Neto total en general</span>
                <strong
                  className={
                    summary && summary.totalNetCents < 0
                      ? "negative"
                      : "positive"
                  }
                >
                  {summary && summary.totalNetCents > 0 ? "+" : ""}
                  {money(summary?.totalNetCents)}
                </strong>
                <p>
                  Resultado acumulado histórico: Total retiradas − Total
                  ingresos.
                </p>
              </div>
              <span className="balance-icon">
                <Dices size={22} />
              </span>
            </div>

            <div className="balance-formula" id="balance-formula">
              <div className="income-formula">
                <span>Total retiradas</span>
                <b>+{money(summary?.totalWithdrawalCents)}</b>
              </div>
              <i>−</i>
              <div className="expense-formula">
                <span>Total ingresos</span>
                <b>−{money(summary?.totalIncomeCents)}</b>
              </div>
              <i>=</i>
              <div>
                <span>Neto histórico</span>
                <b
                  className={
                    summary && summary.totalNetCents < 0
                      ? "amount-negative"
                      : "amount-positive"
                  }
                >
                  {summary && summary.totalNetCents > 0 ? "+" : ""}
                  {money(summary?.totalNetCents)}
                </b>
              </div>
            </div>
          </article>

          {/* Card 2: Neto de Ganancia Diaria */}
          <article className="balance-card daily-card">
            <div className="balance-card-top">
              <div>
                <span className="balance-label">Neto de ganancia diaria</span>
                <strong
                  className={
                    summary && summary.dailyNetCents < 0
                      ? "negative"
                      : "positive"
                  }
                >
                  {summary && summary.dailyNetCents > 0 ? "+" : ""}
                  {money(summary?.dailyNetCents)}
                </strong>
                <p>
                  Ganancia neta del día ({rangeTitle(range, "day")}).
                </p>
              </div>
              <span className="balance-icon">
                <CalendarDays size={22} />
              </span>
            </div>

            <div className="balance-formula">
              <div className="income-formula">
                <span>Retiradas del día</span>
                <b>+{money(summary?.dailyWithdrawalCents)}</b>
              </div>
              <i>−</i>
              <div className="expense-formula">
                <span>Ingresos del día</span>
                <b>−{money(summary?.dailyIncomeCents)}</b>
              </div>
              <i>=</i>
              <div>
                <span>Neto diario</span>
                <b
                  className={
                    summary && summary.dailyNetCents < 0
                      ? "amount-negative"
                      : "amount-positive"
                  }
                >
                  {summary && summary.dailyNetCents > 0 ? "+" : ""}
                  {money(summary?.dailyNetCents)}
                </b>
              </div>
            </div>
          </article>
        </section>

        {/* Mini stats del periodo */}
        <section className="mini-stats" aria-label="Resumen de apuestas">
          <article>
            <span className="stat-icon income-stat">
              <TrendingUp size={19} />
            </span>
            <div>
              <span>Retiradas del periodo</span>
              <strong>+{money(filteredTotals.withdrawal)}</strong>
            </div>
            <ArrowDownLeft className="stat-corner" size={18} />
          </article>
          <article>
            <span className="stat-icon expense-stat">
              <TrendingDown size={19} />
            </span>
            <div>
              <span>Ingresos del periodo</span>
              <strong>−{money(filteredTotals.income)}</strong>
            </div>
            <ArrowUpRight className="stat-corner" size={18} />
          </article>
          <article>
            <span
              className={`stat-icon ${filteredNet >= 0 ? "income-stat" : "expense-stat"}`}
            >
              <CircleDollarSign size={19} />
            </span>
            <div>
              <span>Neto del periodo</span>
              <strong
                style={{
                  color: filteredNet >= 0 ? "var(--green-light)" : "var(--coral)",
                }}
              >
                {filteredNet > 0 ? "+" : ""}
                {money(filteredNet)}
              </strong>
            </div>
          </article>
        </section>

        {/* Lista de movimientos */}
        <section className="movements-card">
          <div className="movements-heading">
            <div>
              <p className="section-kicker">Historial de apuestas</p>
              <h2>Ingresos y retiradas</h2>
            </div>
            <span className="movement-count">
              {items.length} {items.length === 1 ? "movimiento" : "movimientos"}
            </span>
          </div>

          <div className="filter-stack">
            <div
              className="period-filter"
              role="group"
              aria-label="Filtrar por periodo"
            >
              {(Object.keys(periodLabels) as Period[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={period === value ? "active" : ""}
                  onClick={() => selectPeriod(value)}
                  aria-pressed={period === value}
                >
                  {periodLabels[value]}
                </button>
              ))}
            </div>
            <div
              className="type-filter"
              role="group"
              aria-label="Filtrar por tipo"
            >
              {(["all", "income", "withdrawal"] as ViewType[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={viewType === value ? "active" : ""}
                  onClick={() => selectViewType(value)}
                  aria-pressed={viewType === value}
                >
                  {value === "all"
                    ? "Todos"
                    : value === "income"
                      ? "Ingresos"
                      : "Retiradas"}
                </button>
              ))}
            </div>
          </div>

          <div className="date-navigator">
            <button
              type="button"
              onClick={() =>
                selectAnchorDate(shiftDate(anchorDate, period, -1))
              }
              aria-label="Periodo anterior"
            >
              <ChevronLeft size={19} />
            </button>
            <div>
              <span>Periodo seleccionado</span>
              <strong>{rangeTitle(range, period)}</strong>
            </div>
            <button
              type="button"
              onClick={() => selectAnchorDate(shiftDate(anchorDate, period, 1))}
              aria-label="Periodo siguiente"
            >
              <ChevronRight size={19} />
            </button>
            <label className="date-picker">
              <CalendarDays size={16} />
              <span>Ir a fecha</span>
              <input
                type="date"
                value={anchorDate}
                onChange={(event) => selectAnchorDate(event.target.value)}
              />
            </label>
          </div>

          <div className="filtered-summary">
            <span>
              <ArrowDownLeft size={15} /> Retiradas del periodo:{" "}
              <b>+{money(filteredTotals.withdrawal)}</b>
            </span>
            <span>
              <ArrowUpRight size={15} /> Ingresos del periodo:{" "}
              <b>−{money(filteredTotals.income)}</b>
            </span>
            <span>
              <CircleDollarSign size={15} /> Neto del periodo:{" "}
              <b
                style={{
                  color:
                    filteredNet >= 0 ? "var(--green-light)" : "var(--coral)",
                }}
              >
                {filteredNet > 0 ? "+" : ""}
                {money(filteredNet)}
              </b>
            </span>
          </div>

          <div className="transaction-list" aria-live="polite">
            {loadingItems ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div className="transaction-skeleton skeleton" key={index} />
              ))
            ) : items.length === 0 ? (
              <div className="empty-state">
                <span>
                  <CircleDollarSign size={27} />
                </span>
                <h3>No hay movimientos de apuestas aquí</h3>
                <p>
                  Cambia el periodo o registra tu primer ingreso o retirada para
                  esta fecha.
                </p>
                <button
                  type="button"
                  onClick={() => setModal({ type: "withdrawal" })}
                >
                  <Plus size={16} /> Añadir retirada
                </button>
              </div>
            ) : (
              items.map((item) => {
                const isWithdrawal = item.type === "withdrawal";
                const busy = busyId === item.id;
                return (
                  <article
                    className={`transaction-row ${item.status === "settled" ? "settled" : ""}`}
                    key={item.id}
                  >
                    <span
                      className={`transaction-type-icon ${isWithdrawal ? "income" : "expense"}`}
                    >
                      {isWithdrawal ? (
                        <ArrowDownLeft size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                    </span>
                    <div className="transaction-main">
                      <strong>{item.description}</strong>
                      <span>
                        {format(parseISO(item.dueDate), "d MMM yyyy", {
                          locale: es,
                        })}
                        <i>•</i>
                        {isWithdrawal ? "Retirada" : "Ingreso"}
                        <i>•</i>
                        {item.status === "pending"
                          ? "Pendiente"
                          : isWithdrawal
                            ? "Cobrado"
                            : "Ingresado"}
                      </span>
                    </div>
                    <strong
                      className={`transaction-amount ${isWithdrawal ? "income" : "expense"}`}
                    >
                      {isWithdrawal ? "+" : "−"}
                      {money(item.amountCents)}
                    </strong>
                    <div className="transaction-actions">
                      <button
                        className="settle-button"
                        type="button"
                        disabled={busy}
                        onClick={() => toggleStatus(item)}
                        title={
                          item.status === "pending"
                            ? isWithdrawal
                              ? "Marcar cobrado"
                              : "Marcar ingresado"
                            : "Volver a pendiente"
                        }
                      >
                        {item.status === "pending" ? (
                          <Check size={16} />
                        ) : (
                          <RefreshCw size={15} />
                        )}
                        <span>
                          {item.status === "pending"
                            ? isWithdrawal
                              ? "Cobrar"
                              : "Completar"
                            : "Reabrir"}
                        </span>
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => setModal({ type: item.type, item })}
                        aria-label={`Editar ${item.description}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button delete-button"
                        type="button"
                        disabled={busy}
                        onClick={() => removeTransaction(item)}
                        aria-label={`Eliminar ${item.description}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>

      {notice && (
        <div className="toast-success" role="status">
          <Check size={17} /> {notice}
        </div>
      )}

      {modal && (
        <BettingModal
          key={modal.item?.id ?? `new-${modal.type}`}
          item={modal.item}
          initialType={modal.type}
          initialDate={anchorDate}
          onClose={() => setModal(null)}
          onSave={saveTransaction}
        />
      )}
    </div>
  );
}

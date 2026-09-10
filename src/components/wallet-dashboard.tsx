"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  Clock3,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { MonthlyChart } from "@/components/monthly-chart";
import {
  TransactionModal,
  type TransactionDraft,
} from "@/components/transaction-modal";
import { centsToInput, signedAmountToCents } from "@/lib/money";
import { dateRangeForPeriod, type Period } from "@/lib/periods";
import type {
  DashboardSummary,
  TransactionItem,
  TransactionType,
} from "@/types/wallet";

type ViewType = "all" | TransactionType;
type Range = { start: string; end: string };
type ModalState =
  | { type: TransactionType; item?: undefined }
  | { type: TransactionType; item: TransactionItem };

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
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };

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
  if (period === "day") return format(start, "EEEE, d 'de' MMMM", { locale: es });
  if (period === "month") return format(start, "MMMM 'de' yyyy", { locale: es });
  if (period === "quarter") {
    const quarter = Math.floor(start.getMonth() / 3) + 1;
    return `${quarter}.º trimestre de ${start.getFullYear()}`;
  }
  if (period === "year") return String(start.getFullYear());
  return `${format(start, "d MMM", { locale: es })} — ${format(end, "d MMM yyyy", { locale: es })}`;
}

export function WalletDashboard({ initialDate }: { initialDate: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [viewType, setViewType] = useState<ViewType>("all");
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [range, setRange] = useState<Range>(() =>
    dateRangeForPeriod(initialDate, "month"),
  );
  const [loadingItems, setLoadingItems] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [balanceInput, setBalanceInput] = useState("0.00");
  const [savingBalance, setSavingBalance] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadSummary() {
    const nextSummary = await api<DashboardSummary>("/api/dashboard");
    setSummary(nextSummary);
    setBalanceInput(centsToInput(nextSummary.currentBalanceCents));
  }

  async function loadItems() {
    const query = new URLSearchParams({
      period,
      date: anchorDate,
      type: viewType,
    });
    const result = await api<{ items: TransactionItem[]; range: Range }>(
      `/api/transactions?${query}`,
    );
    setItems(result.items);
    setRange(result.range);
  }

  useEffect(() => {
    let active = true;
    api<DashboardSummary>("/api/dashboard")
      .then((nextSummary) => {
        if (!active) return;
        setSummary(nextSummary);
        setBalanceInput(centsToInput(nextSummary.currentBalanceCents));
      })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof SessionExpiredError) router.replace("/login");
        else setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      period,
      date: anchorDate,
      type: viewType,
    });
    api<{ items: TransactionItem[]; range: Range }>(
      `/api/transactions?${query}`,
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
        { income: 0, expense: 0 },
      ),
    [items],
  );

  async function refreshAll() {
    await Promise.all([loadSummary(), loadItems()]);
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

  async function saveBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSavingBalance(true);
    try {
      const currentBalanceCents = signedAmountToCents(balanceInput);
      await api("/api/settings/balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentBalanceCents }),
      });
      await loadSummary();
      setNotice("Saldo actual actualizado");
    } catch (cause) {
      reportError(cause, "No se pudo guardar");
    } finally {
      setSavingBalance(false);
    }
  }

  async function saveTransaction(draft: TransactionDraft) {
    const editing = modal?.item;
    await api(editing ? `/api/transactions/${editing.id}` : "/api/transactions", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setModal(null);
    await refreshAll();
    setNotice(editing ? "Movimiento actualizado" : "Movimiento añadido");
  }

  async function toggleStatus(item: TransactionItem) {
    setBusyId(item.id);
    setError("");
    try {
      await api(`/api/transactions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: item.status === "pending" ? "settled" : "pending",
        }),
      });
      await refreshAll();
      setNotice(item.status === "pending" ? "Movimiento completado" : "Movimiento reabierto");
    } catch (cause) {
      reportError(cause, "No se pudo actualizar");
    } finally {
      setBusyId("");
    }
  }

  async function removeTransaction(item: TransactionItem) {
    if (!window.confirm(`¿Eliminar “${item.description}”? Esta acción no se puede deshacer.`)) {
      return;
    }
    setBusyId(item.id);
    setError("");
    try {
      await api(`/api/transactions/${item.id}`, { method: "DELETE" });
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
        <div className="header-actions">
          <div className="today-label">
            <CalendarDays size={16} />
            <span>{format(parseISO(initialDate), "d MMM yyyy", { locale: es })}</span>
          </div>
          <button className="logout-button" type="button" onClick={logout}>
            <LogOut size={17} /> <span>Salir</span>
          </button>
        </div>
      </header>

      <main className="app-shell">
        <section className="welcome-row">
          <div>
            <p className="section-kicker">Resumen personal</p>
            <h1>Tu dinero, claro y al día.</h1>
          </div>
          <div className="quick-actions">
            <button
              className="quick-button income-button"
              type="button"
              onClick={() => setModal({ type: "income" })}
            >
              <Plus size={17} /> Añadir ingreso
            </button>
            <button
              className="quick-button expense-button"
              type="button"
              onClick={() => setModal({ type: "expense" })}
            >
              <Plus size={17} /> Añadir gasto
            </button>
          </div>
        </section>

        {error && (
          <div className="alert-error" role="alert">
            {error}
            <button type="button" onClick={() => setError("")} aria-label="Cerrar aviso">×</button>
          </div>
        )}

        <section className="overview-grid">
          <article className="balance-card">
            <div className="balance-card-top">
              <div>
                <span className="balance-label">Balance proyectado</span>
                <strong className={summary && summary.projectedBalanceCents < 0 ? "negative" : ""}>
                  {money(summary?.projectedBalanceCents)}
                </strong>
                <p>Lo disponible después de cobrar y pagar todo lo pendiente.</p>
              </div>
              <span className="balance-icon"><Wallet size={22} /></span>
            </div>

            <form className="balance-editor" onSubmit={saveBalance}>
              <label htmlFor="current-balance">Saldo actual editable</label>
              <div className="balance-field-row">
                <span className="balance-input-wrap">
                  <span>€</span>
                  <input
                    id="current-balance"
                    value={balanceInput}
                    onChange={(event) => setBalanceInput(event.target.value)}
                    inputMode="decimal"
                    aria-describedby="balance-formula"
                  />
                </span>
                <button type="submit" disabled={savingBalance}>
                  {savingBalance ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
                  <span>Guardar</span>
                </button>
              </div>
            </form>

            <div className="balance-formula" id="balance-formula">
              <div><span>Saldo actual</span><b>{money(summary?.currentBalanceCents)}</b></div>
              <i>+</i>
              <div className="income-formula"><span>Por recibir</span><b>{money(summary?.pendingIncomeCents)}</b></div>
              <i>−</i>
              <div className="expense-formula"><span>Por pagar</span><b>{money(summary?.pendingExpenseCents)}</b></div>
            </div>
          </article>

          <article className="chart-card">
            <div className="card-heading">
              <div>
                <p className="section-kicker">Previsión</p>
                <h2>Este mes</h2>
              </div>
              <Clock3 size={20} />
            </div>
            <MonthlyChart
              incomeCents={summary?.monthlyIncomeCents ?? 0}
              expenseCents={summary?.monthlyExpenseCents ?? 0}
            />
          </article>
        </section>

        <section className="mini-stats" aria-label="Totales pendientes">
          <article>
            <span className="stat-icon income-stat"><TrendingUp size={19} /></span>
            <div><span>Total por recibir</span><strong>{money(summary?.pendingIncomeCents)}</strong></div>
            <ArrowDownLeft className="stat-corner" size={18} />
          </article>
          <article>
            <span className="stat-icon expense-stat"><TrendingDown size={19} /></span>
            <div><span>Total por pagar</span><strong>{money(summary?.pendingExpenseCents)}</strong></div>
            <ArrowUpRight className="stat-corner" size={18} />
          </article>
        </section>

        <section className="movements-card">
          <div className="movements-heading">
            <div>
              <p className="section-kicker">Historial y planificación</p>
              <h2>Ingresos y gastos</h2>
            </div>
            <span className="movement-count">{items.length} {items.length === 1 ? "movimiento" : "movimientos"}</span>
          </div>

          <div className="filter-stack">
            <div className="period-filter" role="group" aria-label="Filtrar por periodo">
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
            <div className="type-filter" role="group" aria-label="Filtrar por tipo">
              {(["all", "income", "expense"] as ViewType[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={viewType === value ? "active" : ""}
                  onClick={() => selectViewType(value)}
                  aria-pressed={viewType === value}
                >
                  {value === "all" ? "Todos" : value === "income" ? "Ingresos" : "Gastos"}
                </button>
              ))}
            </div>
          </div>

          <div className="date-navigator">
            <button type="button" onClick={() => selectAnchorDate(shiftDate(anchorDate, period, -1))} aria-label="Periodo anterior">
              <ChevronLeft size={19} />
            </button>
            <div>
              <span>Periodo seleccionado</span>
              <strong>{rangeTitle(range, period)}</strong>
            </div>
            <button type="button" onClick={() => selectAnchorDate(shiftDate(anchorDate, period, 1))} aria-label="Periodo siguiente">
              <ChevronRight size={19} />
            </button>
            <label className="date-picker">
              <CalendarDays size={16} />
              <span>Ir a fecha</span>
              <input type="date" value={anchorDate} onChange={(event) => selectAnchorDate(event.target.value)} />
            </label>
          </div>

          <div className="filtered-summary">
            <span><ArrowDownLeft size={15} /> Ingresos del periodo <b>{money(filteredTotals.income)}</b></span>
            <span><ArrowUpRight size={15} /> Gastos del periodo <b>{money(filteredTotals.expense)}</b></span>
          </div>

          <div className="transaction-list" aria-live="polite">
            {loadingItems ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div className="transaction-skeleton skeleton" key={index} />
              ))
            ) : items.length === 0 ? (
              <div className="empty-state">
                <span><CircleDollarSign size={27} /></span>
                <h3>No hay movimientos aquí</h3>
                <p>Cambia el periodo o añade tu primer ingreso o gasto para esta fecha.</p>
                <button type="button" onClick={() => setModal({ type: "expense" })}>
                  <Plus size={16} /> Añadir movimiento
                </button>
              </div>
            ) : (
              items.map((item) => {
                const income = item.type === "income";
                const busy = busyId === item.id;
                return (
                  <article className={`transaction-row ${item.status === "settled" ? "settled" : ""}`} key={item.id}>
                    <span className={`transaction-type-icon ${income ? "income" : "expense"}`}>
                      {income ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </span>
                    <div className="transaction-main">
                      <strong>{item.description}</strong>
                      <span>
                        {format(parseISO(item.dueDate), "d MMM yyyy", { locale: es })}
                        <i>•</i>
                        {item.status === "pending" ? "Pendiente" : income ? "Cobrado" : "Pagado"}
                      </span>
                    </div>
                    <strong className={`transaction-amount ${income ? "income" : "expense"}`}>
                      {income ? "+" : "−"}{money(item.amountCents)}
                    </strong>
                    <div className="transaction-actions">
                      <button
                        className="settle-button"
                        type="button"
                        disabled={busy}
                        onClick={() => toggleStatus(item)}
                        title={item.status === "pending" ? (income ? "Marcar cobrado" : "Marcar pagado") : "Volver a pendiente"}
                      >
                        {item.status === "pending" ? <Check size={16} /> : <RefreshCw size={15} />}
                        <span>{item.status === "pending" ? (income ? "Cobrar" : "Pagar") : "Reabrir"}</span>
                      </button>
                      <button className="icon-button" type="button" onClick={() => setModal({ type: item.type, item })} aria-label={`Editar ${item.description}`}>
                        <Pencil size={16} />
                      </button>
                      <button className="icon-button delete-button" type="button" disabled={busy} onClick={() => removeTransaction(item)} aria-label={`Eliminar ${item.description}`}>
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

      {notice && <div className="toast-success" role="status"><Check size={17} /> {notice}</div>}

      {modal && (
        <TransactionModal
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

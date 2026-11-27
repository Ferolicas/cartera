# Mapa del proyecto — Cartera

## Producto

Cartera financiera privada para registrar ingresos y gastos, controlar vencimientos y proyectar el balance personal.

## Rutas de interfaz

- `/login`: acceso por contraseña única.
- `/`: panel financiero autenticado (Cartera).
- `/apuestas`: panel de apuestas autenticado (ingresos y retiradas).

## API — Cartera

- `GET /api/health`: estado público del servicio.
- `POST /api/auth/login`: valida la contraseña y crea la sesión.
- `POST /api/auth/logout`: elimina la sesión.
- `GET /api/dashboard`: saldo y totales pendientes globales/mensuales.
- `GET /api/transactions`: movimientos filtrados por periodo, fecha y tipo.
- `POST /api/transactions`: crea un movimiento.
- `PATCH /api/transactions/:id`: edita o liquida un movimiento.
- `DELETE /api/transactions/:id`: elimina un movimiento.
- `PUT /api/settings/balance`: actualiza el saldo actual.

## API — Apuestas

- `GET /api/betting/dashboard`: neto total, neto diario, neto del periodo y totales por tipo.
- `GET /api/betting/transactions`: transacciones de apuestas filtradas por periodo, fecha y tipo.
- `POST /api/betting/transactions`: crea una transacción de apuesta (ingreso o retirada).
- `PATCH /api/betting/transactions/:id`: edita una transacción de apuesta.
- `DELETE /api/betting/transactions/:id`: elimina una transacción de apuesta.

## Datos

- `transactions`: concepto, importe en céntimos, tipo (`income`/`expense`), fecha prevista, estado y auditoría temporal.
- `betting_transactions`: concepto, importe en céntimos, tipo (`income`/`withdrawal`), fecha civil y auditoría temporal.
- `settings`: fila única con saldo actual editable y moneda.

## Tipos principales

- `DashboardSummary` (`src/types/wallet.ts`): saldo, proyección, totales del periodo.
- `BettingSummary` (`src/types/betting.ts`): `totalNetCents` (neto acumulado histórico), `dailyNetCents` (neto del día actual), `periodNetCents`, `periodIncomeCents`, `periodWithdrawalCents`.

## Flujos clave

1. El proxy exige un JWT válido salvo para login y health.
2. Cada endpoint privado vuelve a verificar la sesión.
3. El balance proyectado es `saldo actual + ingresos pendientes - gastos pendientes`.
4. El neto de apuestas es `retiradas - ingresos` (ganancia neta); se calcula para el día actual y en acumulado total.
5. Los filtros calculan un rango civil alrededor de la fecha elegida: día, semana ISO, mes, trimestre o año.
6. Marcar un movimiento como cobrado/pagado lo conserva en el historial y lo retira de la proyección pendiente.

## Infraestructura

- Repositorio: `Ferolicas/cartera` (público).
- VPS: `/var/www/cartera`, PM2 `cartera`, puerto `4004`.
- Base de datos: `cartera_db`, usuario dedicado `cartera_user`.
- Dominio: `https://cartera.olcas.app` mediante Caddy.
- CI/CD: push a `main` ejecuta `.github/workflows/deploy.yml`.

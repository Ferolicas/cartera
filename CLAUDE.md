@AGENTS.md

# Cartera

Aplicación privada de finanzas personales del holding Olcas.

## Stack

- Next.js 16 App Router, React 19 y TypeScript.
- PostgreSQL con Drizzle ORM y migraciones en `drizzle/`.
- Autenticación de usuario único con Argon2id y JWT firmado en cookie HttpOnly.
- Recharts para visualizaciones y CSS global sin framework visual.
- Producción nativa en `/var/www/cartera`, PM2 `cartera`, puerto 4004 y Caddy.

## Comandos

- `pnpm dev`: desarrollo.
- `pnpm check`: lint, tipos, pruebas y build.
- `pnpm db:generate`: genera migraciones.
- `pnpm db:migrate`: aplica migraciones.
- `pnpm start`: sirve producción respetando `PORT`.

## Reglas

- Nunca comprometer `.env`; los secretos solo viven localmente y en el VPS.
- Los importes se guardan como céntimos enteros.
- Las fechas financieras son fechas civiles `YYYY-MM-DD` en Europe/Madrid.
- Toda mutación exige sesión válida, validación Zod y comprobación same-origin.
- Mantener `docs/PROJECT-MAP.md` actualizado al cambiar rutas, datos o flujos.

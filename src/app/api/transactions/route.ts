import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import {
  forbiddenOrigin,
  invalidRequest,
  isSameOrigin,
  privateJsonHeaders,
} from "@/lib/http";
import { dateRangeForPeriod } from "@/lib/periods";
import {
  transactionInputSchema,
  transactionQuerySchema,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const parsed = transactionQuerySchema.safeParse({
    period: url.searchParams.get("period") ?? undefined,
    date: url.searchParams.get("date") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });
  if (!parsed.success) return invalidRequest("Los filtros no son válidos");

  const range = dateRangeForPeriod(parsed.data.date, parsed.data.period);
  const conditions = [
    gte(transactions.dueDate, range.start),
    lte(transactions.dueDate, range.end),
  ];
  if (parsed.data.type !== "all") {
    conditions.push(eq(transactions.type, parsed.data.type));
  }

  try {
    const items = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(asc(transactions.dueDate), desc(transactions.createdAt));

    return Response.json(
      { items, range },
      { headers: privateJsonHeaders },
    );
  } catch (error) {
    console.error("Error al consultar movimientos", error);
    return Response.json(
      { error: "No se pudieron cargar los movimientos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const parsed = transactionInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest();

  try {
    const [created] = await db
      .insert(transactions)
      .values(parsed.data)
      .returning();
    return Response.json(created, {
      status: 201,
      headers: privateJsonHeaders,
    });
  } catch (error) {
    console.error("Error al crear el movimiento", error);
    return Response.json(
      { error: "No se pudo guardar el movimiento" },
      { status: 500 },
    );
  }
}

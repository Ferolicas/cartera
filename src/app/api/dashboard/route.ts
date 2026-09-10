import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, transactions } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { privateJsonHeaders } from "@/lib/http";
import { dateRangeForPeriod, todayInMadrid } from "@/lib/periods";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  try {
    await db.insert(settings).values({ id: 1 }).onConflictDoNothing();

    const [configuration, pending] = await Promise.all([
      db.query.settings.findFirst({ where: eq(settings.id, 1) }),
      db
        .select({
          type: transactions.type,
          amountCents: transactions.amountCents,
          dueDate: transactions.dueDate,
        })
        .from(transactions)
        .where(eq(transactions.status, "pending")),
    ]);

    const month = dateRangeForPeriod(todayInMadrid(), "month");
    let pendingIncomeCents = 0;
    let pendingExpenseCents = 0;
    let monthlyIncomeCents = 0;
    let monthlyExpenseCents = 0;

    for (const item of pending) {
      const inMonth = item.dueDate >= month.start && item.dueDate <= month.end;
      if (item.type === "income") {
        pendingIncomeCents += item.amountCents;
        if (inMonth) monthlyIncomeCents += item.amountCents;
      } else {
        pendingExpenseCents += item.amountCents;
        if (inMonth) monthlyExpenseCents += item.amountCents;
      }
    }

    const currentBalanceCents = configuration?.currentBalanceCents ?? 0;
    return Response.json(
      {
        currentBalanceCents,
        currency: configuration?.currency ?? "EUR",
        pendingIncomeCents,
        pendingExpenseCents,
        monthlyIncomeCents,
        monthlyExpenseCents,
        projectedBalanceCents:
          currentBalanceCents + pendingIncomeCents - pendingExpenseCents,
      },
      { headers: privateJsonHeaders },
    );
  } catch (error) {
    console.error("Error al cargar el resumen", error);
    return Response.json(
      { error: "No se pudo cargar el resumen" },
      { status: 500 },
    );
  }
}

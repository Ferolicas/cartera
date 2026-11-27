import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bettingTransactions, settings } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { privateJsonHeaders } from "@/lib/http";
import { dateRangeForPeriod, todayInMadrid } from "@/lib/periods";
import { bettingDashboardQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const parsed = bettingDashboardQuerySchema.safeParse({
    date: url.searchParams.get("date") ?? undefined,
  });
  const targetDate = parsed.success && parsed.data.date ? parsed.data.date : todayInMadrid();

  try {
    const [configuration, allItems] = await Promise.all([
      db.query.settings.findFirst({ where: eq(settings.id, 1) }),
      db
        .select({
          type: bettingTransactions.type,
          amountCents: bettingTransactions.amountCents,
          dueDate: bettingTransactions.dueDate,
          status: bettingTransactions.status,
        })
        .from(bettingTransactions),
    ]);

    const month = dateRangeForPeriod(targetDate, "month");

    let totalIncomeCents = 0;
    let totalWithdrawalCents = 0;

    let dailyIncomeCents = 0;
    let dailyWithdrawalCents = 0;

    let monthlyIncomeCents = 0;
    let monthlyWithdrawalCents = 0;

    let pendingIncomeCents = 0;
    let pendingWithdrawalCents = 0;

    for (const item of allItems) {
      if (item.type === "income") {
        totalIncomeCents += item.amountCents;
        if (item.dueDate === targetDate) dailyIncomeCents += item.amountCents;
        if (item.dueDate >= month.start && item.dueDate <= month.end) {
          monthlyIncomeCents += item.amountCents;
        }
        if (item.status === "pending") pendingIncomeCents += item.amountCents;
      } else {
        totalWithdrawalCents += item.amountCents;
        if (item.dueDate === targetDate) dailyWithdrawalCents += item.amountCents;
        if (item.dueDate >= month.start && item.dueDate <= month.end) {
          monthlyWithdrawalCents += item.amountCents;
        }
        if (item.status === "pending") pendingWithdrawalCents += item.amountCents;
      }
    }

    const totalNetCents = totalWithdrawalCents - totalIncomeCents;
    const dailyNetCents = dailyWithdrawalCents - dailyIncomeCents;
    const monthlyNetCents = monthlyWithdrawalCents - monthlyIncomeCents;

    return Response.json(
      {
        currency: configuration?.currency ?? "EUR",
        targetDate,
        totalIncomeCents,
        totalWithdrawalCents,
        totalNetCents,
        dailyIncomeCents,
        dailyWithdrawalCents,
        dailyNetCents,
        monthlyIncomeCents,
        monthlyWithdrawalCents,
        monthlyNetCents,
        pendingIncomeCents,
        pendingWithdrawalCents,
      },
      { headers: privateJsonHeaders },
    );
  } catch (error) {
    console.error("Error al cargar el resumen de apuestas", error);
    return Response.json(
      { error: "No se pudo cargar el resumen de apuestas" },
      { status: 500 },
    );
  }
}

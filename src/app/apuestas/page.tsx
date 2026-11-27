import { redirect } from "next/navigation";
import { BettingDashboard } from "@/components/betting-dashboard";
import { hasValidSession } from "@/lib/api-auth";
import { todayInMadrid } from "@/lib/periods";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apuestas — Mi Cartera",
  description: "Control y seguimiento de apuestas, ingresos y retiradas.",
};

export default async function ApuestasPage() {
  if (!(await hasValidSession())) redirect("/login");
  return <BettingDashboard initialDate={todayInMadrid()} />;
}

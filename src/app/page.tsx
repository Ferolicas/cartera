import { redirect } from "next/navigation";
import { WalletDashboard } from "@/components/wallet-dashboard";
import { hasValidSession } from "@/lib/api-auth";
import { todayInMadrid } from "@/lib/periods";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await hasValidSession())) redirect("/login");
  return <WalletDashboard initialDate={todayInMadrid()} />;
}

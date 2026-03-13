import { getUserInvestments, getAccountTypes, getCurrencies } from "@/data/investments-read";
import { getUserBanks } from "@/data/banks-read";
import { InvestmentsClient } from "./InvestmentsClient";

export default async function InvestmentsPage() {
  const [investments, accountTypes, currencies, banks] = await Promise.all([
    getUserInvestments(),
    getAccountTypes(),
    getCurrencies(),
    getUserBanks(),
  ]);

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Investments</h1>
        <p className="text-muted-foreground text-sm">Manage your investment accounts.</p>
      </div>
      <InvestmentsClient
        initialInvestments={investments}
        accountTypes={accountTypes}
        currencies={currencies}
        banks={banks}
      />
    </main>
  );
}

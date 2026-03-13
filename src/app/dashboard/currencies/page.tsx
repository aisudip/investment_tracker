import { getCurrencies } from "@/data/currencies-read";
import { CurrenciesClient } from "./CurrenciesClient";

export default async function CurrenciesPage() {
  const currencies = await getCurrencies();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Currencies</h1>
        <p className="text-muted-foreground text-sm">Manage currency codes, names, and symbols.</p>
      </div>
      <CurrenciesClient initialCurrencies={currencies} />
    </div>
  );
}

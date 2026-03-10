import { getUserBanks } from "@/data/banks-read";
import { BanksClient } from "./BanksClient";

export default async function BanksPage() {
  const banks = await getUserBanks();

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Banks</h1>
        <p className="text-muted-foreground text-sm">Manage your bank accounts and relationship managers.</p>
      </div>
      <BanksClient initialBanks={banks} />
    </main>
  );
}

import { getAccountTypes } from "@/data/account-types-read";
import { AccountTypesClient } from "./AccountTypesClient";

export default async function AccountTypesPage() {
  const accountTypes = await getAccountTypes();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account Types</h1>
        <p className="text-muted-foreground text-sm">Manage lookup values for investment account types.</p>
      </div>
      <AccountTypesClient initialAccountTypes={accountTypes} />
    </div>
  );
}

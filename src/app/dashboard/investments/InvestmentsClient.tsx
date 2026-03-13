"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CsvImportButton } from "@/components/CsvImportButton";
import {
  createInvestmentAction,
  updateInvestmentAction,
  deactivateInvestmentAction,
  importInvestmentsAction,
} from "./actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Investment = {
  id: string;
  name: string;
  isActive: boolean;
  nrType: string;
  usdAvailability: boolean;
  accountNumber: string | null;
  notes: string | null;
  accountType: string | null;
  currencyCode: string | null;
  bankName: string | null;
};

type AccountType = { id: number; name: string };
type Currency = { id: number; code: string };
type Bank = { id: number; name: string; ifsc: string | null };

type FormState = {
  id?: string;
  name: string;
  accountTypeId: string;
  currencyId: string;
  nrType: string;
  usdAvailability: boolean;
  bankId: string;
  accountNumber: string;
  notes: string;
};

const empty: FormState = {
  name: "",
  accountTypeId: "",
  currencyId: "",
  nrType: "NA",
  usdAvailability: false,
  bankId: "",
  accountNumber: "",
  notes: "",
};

const CSV_COLUMNS = ["name", "account_type", "currency_code", "nr_type", "usd_availability", "bank_ifsc", "account_number", "notes"];

export function InvestmentsClient({
  initialInvestments,
  accountTypes,
  currencies,
  banks,
}: {
  initialInvestments: Investment[];
  accountTypes: AccountType[];
  currencies: Currency[];
  banks: Bank[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openCreate() {
    setForm(empty);
    setError(null);
    setOpen(true);
  }

  function openEdit(inv: Investment) {
    setForm({
      id: inv.id,
      name: inv.name,
      accountTypeId: accountTypes.find((a) => a.name === inv.accountType)?.id.toString() ?? "",
      currencyId: currencies.find((c) => c.code === inv.currencyCode)?.id.toString() ?? "",
      nrType: inv.nrType,
      usdAvailability: inv.usdAvailability,
      bankId: banks.find((b) => b.name === inv.bankName)?.id.toString() ?? "",
      accountNumber: inv.accountNumber ?? "",
      notes: inv.notes ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      accountTypeId: Number(form.accountTypeId),
      currencyId: Number(form.currencyId),
      nrType: form.nrType as "NRO" | "NRE" | "NA",
      usdAvailability: form.usdAvailability,
      bankId: form.bankId ? Number(form.bankId) : undefined,
      accountNumber: form.accountNumber || undefined,
      notes: form.notes || undefined,
    };

    const result = form.id
      ? await updateInvestmentAction({ id: form.id, ...payload })
      : await createInvestmentAction(payload);

    setSaving(false);
    if ("error" in result) {
      setError(result.error ?? "Unknown error");
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate "${name}"?`)) return;
    const result = await deactivateInvestmentAction({ id });
    if ("error" in result) alert(result.error);
    else router.refresh();
  }

  async function handleActivate(id: string, name: string) {
    if (!confirm(`Activate "${name}"?`)) return;
    const result = await updateInvestmentAction({ id, isActive: true });
    if ("error" in result) alert(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={openCreate}>Add Investment</Button>
        <CsvImportButton
          label="Import Investments CSV"
          requiredColumns={["name", "account_type", "currency_code"]}
          onImport={(rows) =>
            importInvestmentsAction(
              rows.map((r) => ({
                name: r.name,
                accountType: r.account_type,
                currencyCode: r.currency_code,
                nrType: r.nr_type,
                usdAvailability: r.usd_availability,
                bankIfsc: r.bank_ifsc,
                accountNumber: r.account_number,
                notes: r.notes,
              }))
            )
          }
          onSuccess={() => router.refresh()}
        />
        <p className="text-sm text-muted-foreground">
          CSV columns: {CSV_COLUMNS.join(", ")}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>NR Type</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialInvestments.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No investments yet.
              </TableCell>
            </TableRow>
          )}
          {initialInvestments.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.name}</TableCell>
              <TableCell>{inv.accountType ?? "—"}</TableCell>
              <TableCell>{inv.currencyCode ?? "—"}</TableCell>
              <TableCell>{inv.nrType}</TableCell>
              <TableCell>{inv.bankName ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={inv.isActive ? "secondary" : "outline"}>
                  {inv.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/investments/${inv.id}/snapshots`}>Snapshots</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(inv)}>Edit</Button>
                {inv.isActive ? (
                  <Button variant="destructive" size="sm" onClick={() => handleDeactivate(inv.id, inv.name)}>
                    Deactivate
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleActivate(inv.id, inv.name)}>
                    Activate
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Investment" : "Add Investment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="inv-name">Name *</Label>
              <Input id="inv-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Account Type *</Label>
                <Select value={form.accountTypeId} onValueChange={(v) => set("accountTypeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Currency *</Label>
                <Select value={form.currencyId} onValueChange={(v) => set("currencyId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>NR Type</Label>
                <Select value={form.nrType} onValueChange={(v) => set("nrType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NA">NA</SelectItem>
                    <SelectItem value="NRO">NRO</SelectItem>
                    <SelectItem value="NRE">NRE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Bank</Label>
                <Select value={form.bankId || "none"} onValueChange={(v) => set("bankId", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="usdAvailability"
                  checked={form.usdAvailability}
                  onChange={(e) => set("usdAvailability", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="usdAvailability">USD Available</Label>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea id="inv-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

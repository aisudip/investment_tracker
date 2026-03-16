"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CsvImportButton } from "@/components/CsvImportButton";
import { upsertSnapshotAction, deleteSnapshotAction, importSnapshotsAction } from "./actions";
import { useRouter } from "next/navigation";

type Snapshot = {
  id: number;
  snapshotDate: Date;
  valueInCurrency: string;
  valueInInr: string | null;
  valueInUsd: string | null;
  exchangeRateToInr: string | null;
  exchangeRateToUsd: string | null;
  notes: string | null;
};

type FormState = {
  id?: number;
  snapshotDate: string;
  valueInCurrency: string;
  valueInInr: string;
  valueInUsd: string;
  exchangeRateToInr: string;
  exchangeRateToUsd: string;
  notes: string;
};

const empty: FormState = {
  snapshotDate: "",
  valueInCurrency: "",
  valueInInr: "",
  valueInUsd: "",
  exchangeRateToInr: "",
  exchangeRateToUsd: "",
  notes: "",
};

const CSV_COLUMNS = [
  "investment_name_or_id",
  "snapshot_date",
  "value_in_home_currency",
];

export function SnapshotsClient({
  investmentId,
  investmentName,
  initialSnapshots,
}: {
  investmentId: string;
  investmentName: string;
  initialSnapshots: Snapshot[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openCreate() {
    setForm(empty);
    setError(null);
    setOpen(true);
  }

  function openEdit(snap: Snapshot) {
    setForm({
      id: snap.id,
      snapshotDate: snap.snapshotDate.toISOString().slice(0, 10),
      valueInCurrency: snap.valueInCurrency,
      valueInInr: snap.valueInInr ?? "",
      valueInUsd: snap.valueInUsd ?? "",
      exchangeRateToInr: snap.exchangeRateToInr ?? "",
      exchangeRateToUsd: snap.exchangeRateToUsd ?? "",
      notes: snap.notes ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const result = await upsertSnapshotAction({
      investmentId,
      snapshotDate: form.snapshotDate,
      valueInCurrency: form.valueInCurrency,
      valueInInr: form.valueInInr || undefined,
      valueInUsd: form.valueInUsd || undefined,
      exchangeRateToInr: form.exchangeRateToInr || undefined,
      exchangeRateToUsd: form.exchangeRateToUsd || undefined,
      notes: form.notes || undefined,
    });

    setSaving(false);
    if ("error" in result) {
      setError(result.error ?? "Unknown error");
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this snapshot?")) return;
    const result = await deleteSnapshotAction({ id });
    if ("error" in result) alert(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={openCreate}>Add Snapshot</Button>
        <CsvImportButton
          label="Import Snapshots CSV"
          requiredColumns={["investment_name_or_id", "snapshot_date", "value_in_home_currency"]}
          onImport={(rows) =>
            importSnapshotsAction(
              rows.map((r) => ({
                investmentNameOrId: r.investment_name_or_id,
                snapshotDate: r.snapshot_date,
                valueInHomeCurrency: r.value_in_home_currency,
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
            <TableHead>Date</TableHead>
            <TableHead>Value (Currency)</TableHead>
            <TableHead>Value (INR)</TableHead>
            <TableHead>Value (USD)</TableHead>
            <TableHead>Rate → INR</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialSnapshots.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No snapshots yet.
              </TableCell>
            </TableRow>
          )}
          {initialSnapshots.map((snap) => (
            <TableRow key={snap.id}>
              <TableCell>{format(snap.snapshotDate, "do MMM yyyy")}</TableCell>
              <TableCell>{snap.valueInCurrency}</TableCell>
              <TableCell>{snap.valueInInr ?? "—"}</TableCell>
              <TableCell>{snap.valueInUsd ?? "—"}</TableCell>
              <TableCell>{snap.exchangeRateToInr ?? "—"}</TableCell>
              <TableCell className="max-w-[160px] truncate">{snap.notes ?? "—"}</TableCell>
              <TableCell className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => openEdit(snap)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(snap.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Snapshot" : "Add Snapshot"} — {investmentName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="snapshotDate">Date *</Label>
              <Input id="snapshotDate" type="date" value={form.snapshotDate} onChange={(e) => set("snapshotDate", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valueInCurrency">Value in Currency *</Label>
              <Input id="valueInCurrency" value={form.valueInCurrency} onChange={(e) => set("valueInCurrency", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="valueInInr">Value in INR</Label>
                <Input id="valueInInr" value={form.valueInInr} onChange={(e) => set("valueInInr", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="valueInUsd">Value in USD</Label>
                <Input id="valueInUsd" value={form.valueInUsd} onChange={(e) => set("valueInUsd", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="exchangeRateToInr">Rate → INR</Label>
                <Input id="exchangeRateToInr" value={form.exchangeRateToInr} onChange={(e) => set("exchangeRateToInr", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="exchangeRateToUsd">Rate → USD</Label>
                <Input id="exchangeRateToUsd" value={form.exchangeRateToUsd} onChange={(e) => set("exchangeRateToUsd", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="snap-notes">Notes</Label>
              <Textarea id="snap-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
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

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createCurrencyAction, updateCurrencyAction, deleteCurrencyAction } from "./actions";
import { useRouter } from "next/navigation";

type Currency = { id: number; code: string; name: string | null; symbol: string | null };
type FormState = { id?: number; code: string; name: string; symbol: string };

const empty: FormState = { code: "", name: "", symbol: "" };

export function CurrenciesClient({ initialCurrencies }: { initialCurrencies: Currency[] }) {
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

  function openEdit(row: Currency) {
    setForm({ id: row.id, code: row.code, name: row.name ?? "", symbol: row.symbol ?? "" });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const payload = {
      code: form.code,
      name: form.name || undefined,
      symbol: form.symbol || undefined,
    };
    const result = form.id
      ? await updateCurrencyAction({ id: form.id, ...payload })
      : await createCurrencyAction(payload);

    setSaving(false);
    if ("error" in result) {
      setError(result.error ?? "Unknown error");
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: number, code: string) {
    if (!confirm(`Delete "${code}"? This may fail if investments reference it.`)) return;
    const result = await deleteCurrencyAction({ id });
    if ("error" in result) alert(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}>Add Currency</Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialCurrencies.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No currencies yet.
              </TableCell>
            </TableRow>
          )}
          {initialCurrencies.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.code}</TableCell>
              <TableCell>{row.name ?? "—"}</TableCell>
              <TableCell>{row.symbol ?? "—"}</TableCell>
              <TableCell className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => openEdit(row)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(row.id, row.code)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Currency" : "Add Currency"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cur-code">Code * (e.g. INR)</Label>
              <Input id="cur-code" value={form.code} onChange={(e) => set("code", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cur-name">Name</Label>
                <Input id="cur-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cur-symbol">Symbol</Label>
                <Input id="cur-symbol" value={form.symbol} onChange={(e) => set("symbol", e.target.value)} />
              </div>
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

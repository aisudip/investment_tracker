"use client";

import { useState } from "react";
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
import { createBankAction, updateBankAction, deleteBankAction, importBanksAction } from "./actions";
import { useRouter } from "next/navigation";

type Bank = {
  id: number;
  name: string;
  branch: string | null;
  ifsc: string | null;
  swiftCode: string | null;
  address: string | null;
  rmName: string | null;
  rmEmail: string | null;
  rmPhone: string | null;
};

type FormState = Omit<Bank, "id"> & { id?: number };

const empty: FormState = {
  name: "",
  branch: null,
  ifsc: null,
  swiftCode: null,
  address: null,
  rmName: null,
  rmEmail: null,
  rmPhone: null,
};

const CSV_COLUMNS = ["name", "branch", "ifsc", "swift_code", "address", "rm_name", "rm_email", "rm_phone"];

export function BanksClient({ initialBanks }: { initialBanks: Bank[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value || null }));
  }

  function openCreate() {
    setForm(empty);
    setError(null);
    setOpen(true);
  }

  function openEdit(bank: Bank) {
    setForm(bank);
    setError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name ?? "",
      branch: form.branch ?? undefined,
      ifsc: form.ifsc ?? undefined,
      swiftCode: form.swiftCode ?? undefined,
      address: form.address ?? undefined,
      rmName: form.rmName ?? undefined,
      rmEmail: form.rmEmail ?? undefined,
      rmPhone: form.rmPhone ?? undefined,
    };

    const result = form.id
      ? await updateBankAction({ id: form.id, ...payload })
      : await createBankAction(payload);

    setSaving(false);
    if ("error" in result) {
      setError(result.error ?? "Unknown error");
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this bank? Any linked investments will be unlinked.")) return;
    const result = await deleteBankAction({ id });
    if ("error" in result) alert(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={openCreate}>Add Bank</Button>
        <CsvImportButton
          label="Import Banks CSV"
          requiredColumns={["name"]}
          onImport={(rows) =>
            importBanksAction(
              rows.map((r) => ({
                name: r.name,
                branch: r.branch,
                ifsc: r.ifsc,
                swiftCode: r.swift_code,
                address: r.address,
                rmName: r.rm_name,
                rmEmail: r.rm_email,
                rmPhone: r.rm_phone,
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
            <TableHead>Branch</TableHead>
            <TableHead>IFSC</TableHead>
            <TableHead>SWIFT</TableHead>
            <TableHead>RM</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialBanks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No banks yet.
              </TableCell>
            </TableRow>
          )}
          {initialBanks.map((bank) => (
            <TableRow key={bank.id}>
              <TableCell className="font-medium">{bank.name}</TableCell>
              <TableCell>{bank.branch ?? "—"}</TableCell>
              <TableCell>{bank.ifsc ?? "—"}</TableCell>
              <TableCell>{bank.swiftCode ?? "—"}</TableCell>
              <TableCell>{bank.rmName ?? "—"}</TableCell>
              <TableCell className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => openEdit(bank)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(bank.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Bank" : "Add Bank"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Bank Name *</Label>
              <Input id="name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="branch">Branch</Label>
                <Input id="branch" value={form.branch ?? ""} onChange={(e) => set("branch", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ifsc">IFSC</Label>
                <Input id="ifsc" value={form.ifsc ?? ""} onChange={(e) => set("ifsc", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="swiftCode">SWIFT Code</Label>
                <Input id="swiftCode" value={form.swiftCode ?? ""} onChange={(e) => set("swiftCode", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rmName">RM Name</Label>
                <Input id="rmName" value={form.rmName ?? ""} onChange={(e) => set("rmName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rmEmail">RM Email</Label>
                <Input id="rmEmail" type="email" value={form.rmEmail ?? ""} onChange={(e) => set("rmEmail", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rmPhone">RM Phone</Label>
                <Input id="rmPhone" value={form.rmPhone ?? ""} onChange={(e) => set("rmPhone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
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

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
import { createAccountTypeAction, updateAccountTypeAction, deleteAccountTypeAction } from "./actions";
import { useRouter } from "next/navigation";

type AccountType = { id: number; name: string; description: string | null };
type FormState = { id?: number; name: string; description: string };

const empty: FormState = { name: "", description: "" };

export function AccountTypesClient({ initialAccountTypes }: { initialAccountTypes: AccountType[] }) {
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

  function openEdit(row: AccountType) {
    setForm({ id: row.id, name: row.name, description: row.description ?? "" });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const payload = { name: form.name, description: form.description || undefined };
    const result = form.id
      ? await updateAccountTypeAction({ id: form.id, ...payload })
      : await createAccountTypeAction(payload);

    setSaving(false);
    if ("error" in result) {
      setError(result.error ?? "Unknown error");
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This may fail if investments reference it.`)) return;
    const result = await deleteAccountTypeAction({ id });
    if ("error" in result) alert(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}>Add Account Type</Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialAccountTypes.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No account types yet.
              </TableCell>
            </TableRow>
          )}
          {initialAccountTypes.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => openEdit(row)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(row.id, row.name)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Account Type" : "Add Account Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="at-name">Name *</Label>
              <Input id="at-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="at-desc">Description</Label>
              <Textarea id="at-desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
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

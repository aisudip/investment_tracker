"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
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

type ImportResult = { success: boolean; imported: number; error?: undefined } | { error: string; success?: undefined; imported?: undefined };

type Props = {
  label?: string;
  requiredColumns: string[];
  onImport: (rows: Record<string, string>[]) => Promise<ImportResult>;
  onSuccess?: () => void;
};

export function CsvImportButton({
  label = "Import CSV",
  requiredColumns,
  onImport,
  onSuccess,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setImportError(null);
    setImportedCount(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const cols = results.meta.fields ?? [];
        const missing = requiredColumns.filter((r) => !cols.includes(r));
        if (missing.length > 0) {
          setParseError(`Missing required columns: ${missing.join(", ")}`);
          return;
        }
        setHeaders(cols);
        setRows(results.data);
        setOpen(true);
      },
      error(err) {
        setParseError(err.message);
      },
    });

    // Reset so same file can be re-selected
    e.target.value = "";
  }

  async function handleImport() {
    setImporting(true);
    setImportError(null);
    try {
      const result = await onImport(rows);
      if ("error" in result) {
        setImportError(result.error ?? "Unknown error");
      } else {
        setImportedCount(result.imported);
        setRows([]);
        onSuccess?.();
      }
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setRows([]);
    setHeaders([]);
    setImportError(null);
    setImportedCount(null);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      {parseError && (
        <p className="text-sm text-destructive">{parseError}</p>
      )}
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        {label}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview — {rows.length} row{rows.length !== 1 ? "s" : ""}</DialogTitle>
          </DialogHeader>

          {importedCount !== null ? (
            <div className="py-4 text-center">
              <Badge variant="secondary" className="text-base px-4 py-2">
                {importedCount} record{importedCount !== 1 ? "s" : ""} imported successfully
              </Badge>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h} className="max-w-[200px] truncate">
                          {row[h] ?? ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  …and {rows.length - 10} more rows
                </p>
              )}
            </div>
          )}

          {importError && (
            <p className="text-sm text-destructive">{importError}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {importedCount !== null ? "Close" : "Cancel"}
            </Button>
            {importedCount === null && (
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Importing…" : `Import ${rows.length} rows`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

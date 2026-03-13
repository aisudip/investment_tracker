import { getAllSnapshots } from "@/data/snapshots-read";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function SnapshotsPage() {
  const snapshots = await getAllSnapshots();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Snapshots</h1>
        <p className="text-muted-foreground text-sm">All investment snapshots across your portfolio.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Investment</TableHead>
            <TableHead>Value (Currency)</TableHead>
            <TableHead>Value (INR)</TableHead>
            <TableHead>Value (USD)</TableHead>
            <TableHead>Rate → INR</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {snapshots.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No snapshots yet.
              </TableCell>
            </TableRow>
          )}
          {snapshots.map((snap) => (
            <TableRow key={snap.id}>
              <TableCell>{format(snap.snapshotDate, "do MMM yyyy")}</TableCell>
              <TableCell className="font-medium">{snap.investmentName}</TableCell>
              <TableCell>{snap.valueInCurrency}</TableCell>
              <TableCell>{snap.valueInInr ?? "—"}</TableCell>
              <TableCell>{snap.valueInUsd ?? "—"}</TableCell>
              <TableCell>{snap.exchangeRateToInr ?? "—"}</TableCell>
              <TableCell className="max-w-[160px] truncate">{snap.notes ?? "—"}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/investments/${snap.investmentId}/snapshots`}>Manage</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

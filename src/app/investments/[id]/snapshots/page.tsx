import { getSnapshotsForInvestment } from "@/data/snapshots-read";
import { SnapshotsClient } from "./SnapshotsClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function SnapshotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { investment, snapshots } = await getSnapshotsForInvestment(id);

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/investments">← Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{investment.name}</h1>
          <p className="text-muted-foreground text-sm">Snapshot history</p>
        </div>
      </div>
      <SnapshotsClient
        investmentId={id}
        investmentName={investment.name}
        initialSnapshots={snapshots}
      />
    </main>
  );
}

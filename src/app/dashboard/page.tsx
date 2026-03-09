import { fetchSeries } from '@/app/api/dashboard/timeline/route';
import type { GroupBy } from '@/app/api/dashboard/timeline/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TimelineChart from './TimelineChart';
import GroupBySelector from './GroupBySelector';

interface PageProps {
  searchParams: Promise<{ groupBy?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { groupBy: rawGroupBy } = await searchParams;
  const groupBy: GroupBy =
    rawGroupBy === 'accountType' || rawGroupBy === 'currency' || rawGroupBy === 'nrType'
      ? rawGroupBy
      : 'total';

  const series = await fetchSeries(groupBy);

  // Summary stats from the "Total" series (first series when groupBy=total,
  // or summed across all series for a given date range otherwise)
  const allPoints = series.flatMap((s) => s.data);
  const datesSorted = [...new Set(allPoints.map((p) => p.date))].sort();
  const totalForDate = (date: string) =>
    series.reduce((sum, s) => {
      const pt = s.data.find((d) => d.date === date);
      return sum + (pt?.totalInr ?? 0);
    }, 0);

  const latestTotal = datesSorted.length > 0 ? totalForDate(datesSorted.at(-1)!) : 0;
  const firstTotal = datesSorted.length > 0 ? totalForDate(datesSorted[0]) : 0;
  const change = firstTotal > 0 ? ((latestTotal - firstTotal) / firstTotal) * 100 : 0;
  const isPositive = change >= 0;
  const snapshotDates = datesSorted.length;

  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Total investment value over time (INR)</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Current Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatInrDisplay(latestTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide font-medium">All-time Change</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${isPositive ? 'text-chart-2' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Snapshot Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{snapshotDates}</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Investment Timeline</CardTitle>
            <GroupBySelector current={groupBy} />
          </CardHeader>
          <CardContent>
            <TimelineChart series={series} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatInrDisplay(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

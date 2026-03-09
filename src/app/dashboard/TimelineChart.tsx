'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import type { TimelineSeries } from '@/data/timeline';
import type { DisplayCurrency } from './page';

export type { TimelineSeries };

// Chart CSS variable palette — matches the chart-1…5 tokens in globals.css
const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

const PADDING = { top: 24, right: 24, bottom: 90, left: 80 };
const VIEW_W = 800;
const VIEW_H = 360;
const PLOT_W = VIEW_W - PADDING.left - PADDING.right;
const PLOT_H = VIEW_H - PADDING.top - PADDING.bottom;
const TICK_COUNT = 5;

function formatValue(value: number, currency: DisplayCurrency): string {
  if (currency === 'USD') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

function formatDate(iso: string): string {
  return format(new Date(iso), 'do MMM yyyy');
}

interface Props {
  series: TimelineSeries[];
  currency: DisplayCurrency;
}

export default function TimelineChart({ series, currency }: Props) {
  const { allDates, plotSeries, yTicks, xLabels } = useMemo(() => {
    if (series.length === 0 || series.every((s) => s.data.length === 0)) {
      return { allDates: [], plotSeries: [], yTicks: [], xLabels: [] };
    }

    const valueField = currency === 'USD' ? 'totalUsd' : 'totalInr';

    // Collect all unique dates sorted
    const dateSet = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => dateSet.add(d.date)));
    const allDates = Array.from(dateSet).sort();

    // Y domain across all series
    let globalMin = Infinity;
    let globalMax = -Infinity;
    series.forEach((s) =>
      s.data.forEach((d) => {
        const v = d[valueField];
        if (v < globalMin) globalMin = v;
        if (v > globalMax) globalMax = v;
      })
    );
    const pad = (globalMax - globalMin) * 0.1 || 1;
    const minY = Math.max(0, globalMin - pad);
    const maxY = globalMax + pad;

    const toX = (dateIdx: number) =>
      (dateIdx / (allDates.length - 1 || 1)) * PLOT_W;
    const toY = (v: number) =>
      PLOT_H - ((v - minY) / (maxY - minY)) * PLOT_H;

    // Map each series to plot points (sparse series get only their own date indices)
    const plotSeries = series.map((s) => {
      const lookup = new Map(s.data.map((d) => [d.date, d[valueField]]));
      const points = allDates
        .map((date, i) => {
          const v = lookup.get(date);
          return v !== undefined ? { x: toX(i), y: toY(v), date, value: v } : null;
        })
        .filter(Boolean) as { x: number; y: number; date: string; value: number }[];
      return { label: s.label, points };
    });

    const yStep = (maxY - minY) / (TICK_COUNT - 1);
    const yTicks = Array.from({ length: TICK_COUNT }, (_, i) => {
      const value = minY + yStep * i;
      return { value, y: toY(value), label: formatValue(value, currency) };
    });

    const labelStep = Math.max(1, Math.floor(allDates.length / 8));
    const xLabels = allDates
      .map((date, i) => ({ i, label: formatDate(date), x: toX(i) }))
      .filter((_, i) => i % labelStep === 0 || i === allDates.length - 1);

    return { allDates, plotSeries, yTicks, xLabels, minY, maxY };
  }, [series, currency]);

  if (allDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No snapshot data available yet.
      </div>
    );
  }

  const showDots = allDates.length <= 30;

  return (
    <div className="space-y-4">
      {/* Legend (only for multi-series) */}
      {series.length > 1 && (
        <div className="flex flex-wrap gap-4">
          {plotSeries.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              {s.label}
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        aria-label="Investment timeline chart"
      >
        <defs>
          {plotSeries.map((_, i) => (
            <linearGradient key={i} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity="0.25" />
              <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
          {/* Y gridlines + labels */}
          {yTicks.map((t) => (
            <g key={t.value}>
              <line
                x1={0} y1={t.y} x2={PLOT_W} y2={t.y}
                stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4"
              />
              <text
                x={-8} y={t.y}
                textAnchor="end" dominantBaseline="middle"
                fontSize="11" fill="var(--color-muted-foreground)"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* X axis labels — rotated vertically */}
          {xLabels.map((l) => (
            <text
              key={l.i}
              x={l.x} y={PLOT_H + 8}
              textAnchor="end" fontSize="11" fill="var(--color-muted-foreground)"
              transform={`rotate(-90, ${l.x}, ${PLOT_H + 8})`}
            >
              {l.label}
            </text>
          ))}

          {/* One area + line per series */}
          {plotSeries.map((s, i) => {
            if (s.points.length === 0) return null;
            const color = CHART_COLORS[i % CHART_COLORS.length];
            const polylinePoints = s.points.map((p) => `${p.x},${p.y}`).join(' ');
            const areaPath =
              `M ${s.points[0].x},${PLOT_H} ` +
              s.points.map((p) => `L ${p.x},${p.y}`).join(' ') +
              ` L ${s.points[s.points.length - 1].x},${PLOT_H} Z`;

            return (
              <g key={s.label}>
                <path d={areaPath} fill={`url(#areaGrad${i})`} />
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {showDots &&
                  s.points.map((p) => (
                    <circle
                      key={p.date}
                      cx={p.x} cy={p.y} r="3.5"
                      fill={color}
                      stroke="var(--color-background)"
                      strokeWidth="2"
                    />
                  ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

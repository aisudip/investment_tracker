'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { GroupBy } from '@/app/api/dashboard/timeline/route';

const OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'total',       label: 'Total' },
  { value: 'accountType', label: 'Account Type' },
  { value: 'currency',    label: 'Currency' },
  { value: 'nrType',      label: 'NR Type' },
];

interface Props {
  current: GroupBy;
}

export default function GroupBySelector({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(val: GroupBy) {
    const params = new URLSearchParams();
    if (val !== 'total') params.set('groupBy', val);
    router.push(val === 'total' ? pathname : `${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Group by</span>
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

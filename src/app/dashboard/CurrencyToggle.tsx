'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { DisplayCurrency } from './page';

interface Props {
  current: DisplayCurrency;
}

export default function CurrencyToggle({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(val: string) {
    if (!val) return;
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'INR') {
      params.delete('currency');
    } else {
      params.set('currency', val);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <ToggleGroup type="single" value={current} onValueChange={handleChange} size="sm">
      <ToggleGroupItem value="INR" aria-label="Display in INR">₹ INR</ToggleGroupItem>
      <ToggleGroupItem value="USD" aria-label="Display in USD">$ USD</ToggleGroupItem>
    </ToggleGroup>
  );
}

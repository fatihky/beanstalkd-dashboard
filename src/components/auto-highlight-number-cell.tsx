import { useEffect, useState } from 'preact/hooks';
import { cn } from '@/lib/utils';

export function AutoHighlightNumberCell({ value }: { value: number }) {
  const [changed, setChanged] = useState(false);
  const [lastValue, setLastValue] = useState(value);

  useEffect(() => {
    if (value === lastValue) return;

    setChanged(true);
    setLastValue(value);

    setTimeout(() => setChanged(false), 250);
  }, [lastValue, value]);

  return (
    <span
      className={cn(
        'transition duration-200 p-2',
        changed ? 'text-primary font-bold' : 'text-black',
      )}
    >
      {value}
    </span>
  );
}

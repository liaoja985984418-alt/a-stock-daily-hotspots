'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
}

export default function DatePicker({ dates, selected, onSelect }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = new Date(selected + 'T00:00:00');
  const availableSet = new Set(dates);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[200px] justify-start text-left font-normal',
            !selected && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              const str = format(date, 'yyyy-MM-dd');
              if (availableSet.has(str)) {
                onSelect(str);
                setOpen(false);
              }
            }
          }}
          disabled={(date) => {
            const str = format(date, 'yyyy-MM-dd');
            return !availableSet.has(str);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

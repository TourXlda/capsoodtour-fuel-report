"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterDatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  className?: string;
}

export function FilterDatePicker({
  id,
  label,
  value,
  onChange,
  minDate,
  className,
}: FilterDatePickerProps) {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : undefined;
  const minSelectableDate = minDate ? new Date(`${minDate}T00:00:00`) : undefined;

  return (
    <div className={cn("min-w-0 w-full space-y-2", className)}>
      <label
        htmlFor={id}
        className="text-xs sm:text-sm font-semibold text-foreground block"
      >
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            type="button"
            className={cn(
              "h-11 w-full justify-between text-left font-normal rounded-xl border-slate-200 bg-white text-sm px-3 shadow-none hover:bg-white hover:text-slate-900",
              !value && "text-slate-400",
            )}
          >
            {value ? (
              <span className="truncate pr-2">
                {format(new Date(`${value}T00:00:00`), "PPP")}
              </span>
            ) : (
              <span className="truncate pr-2">Pick a date</span>
            )}
            <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-xl shadow-xl border border-slate-100"
          align="start"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            disabled={
              minSelectableDate
                ? (date) => date < minSelectableDate
                : undefined
            }
            onSelect={(date) => {
              if (!date) {
                onChange("");
                return;
              }

              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, "0");
              const dd = String(date.getDate()).padStart(2, "0");
              onChange(`${yyyy}-${mm}-${dd}`);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

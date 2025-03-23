import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  className?: string;
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  className,
}: DateTimePickerProps) {
  // Initialize with current date and time on first render
  useEffect(() => {
    if (!date || !time) {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);
      
      if (!date) onDateChange(currentDate);
      if (!time) onTimeChange(currentTime);
    }
  }, [date, time, onDateChange, onTimeChange]);

  return (
    <div className={cn("bg-[#1E1E1E] rounded-lg p-4 shadow-md border border-[#3A3A3A]", className)}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-md font-medium">Date & Time</h2>
        <span className="text-xs text-[#8A8A8A]">Auto-filled</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="obsDate" className="block text-xs font-medium text-[#8A8A8A] mb-1">
            Date
          </Label>
          <Input
            type="date"
            id="obsDate"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
          />
        </div>
        <div>
          <Label htmlFor="obsTime" className="block text-xs font-medium text-[#8A8A8A] mb-1">
            Time
          </Label>
          <Input
            type="time"
            id="obsTime"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full rounded bg-[#3A3A3A] border-0 py-2 px-3 text-white focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

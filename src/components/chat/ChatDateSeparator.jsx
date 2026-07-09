import React from "react";
import { format, isToday, isYesterday } from "date-fns";

export default function ChatDateSeparator({ date }) {
  const d = new Date(date);
  let label;
  if (isToday(d)) label = "Today";
  else if (isYesterday(d)) label = "Yesterday";
  else label = format(d, "EEEE, MMM d");

  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  );
}
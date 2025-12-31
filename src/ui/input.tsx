import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base md:text-sm transition-[color,box-shadow] outline-none",
        "bg-[#1A1D26] border-[#1F2230] text-[#ECECF3] placeholder:text-[#6D7385]",
        "selection:bg-[#4169E1]/80 selection:text-white",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#ECECF3]",
        "focus-visible:border-[#4169E1] focus-visible:ring-[#4169E1]/50 focus-visible:ring-[3px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-[#E16941]/20 aria-invalid:border-[#E16941]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

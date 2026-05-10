import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base md:text-sm transition-[color,box-shadow] outline-none",
        "app-input",
        "selection:bg-[#6d42ff]/80 selection:text-white",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#F5F2F7]",
        "focus-visible:border-[#8b61ff] focus-visible:ring-[#8b61ff]/35 focus-visible:ring-[3px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-[#E16941]/20 aria-invalid:border-[#E16941]",
        className,
      )}
      {...props}
    />
  );
  }
);

Input.displayName = "Input";

export { Input };

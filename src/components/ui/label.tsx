
import * as React from "react"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "gap-2 font-semibold peer-data-[slot=checkbox]:text-sm peer-data-[slot=radio-group-item]:text-sm peer-data-[slot=switch]:text-sm leading-relaxed group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 peer-data-[slot=checkbox]:font-normal peer-data-[slot=radio-group-item]:font-normal peer-data-[slot=switch]:font-normal text-xs peer-data-[slot=checkbox]:normal-case peer-data-[slot=checkbox]:tracking-normal peer-data-[slot=radio-group-item]:normal-case peer-data-[slot=radio-group-item]:tracking-normal peer-data-[slot=switch]:normal-case peer-data-[slot=switch]:tracking-normal flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
}

export { Label }

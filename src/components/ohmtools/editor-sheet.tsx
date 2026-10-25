// ohmtools/design: shadcn/src/components/ohmtools/editor-sheet.tsx (copied by `ohmtools-design add`, do not edit)
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PanelHeader } from "@/components/ohmtools/panel-header";
import { PhoneDrawer } from "@/components/ohmtools/phone-drawer";
import { useStep } from "@/lib/ohmtools/steps";

// Editing that is the point of the view and takes effect at once (faltung's
// formulas) stands in the page where it fits (DESIGN.md, "Which group").
// Where it does not, this is its container: a drawer from the bottom on
// phones, a sheet from the right on compact screens, so the result stays in
// sight. Changes apply at once, so a swipe down, a press outside and Esc
// close it. On wide screens the editor belongs in the page.
export function EditorSheet({
  open,
  onOpenChange,
  title,
  closeLabel = "Close",
  initialFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel?: string;
  // Focus the title, not the first field, so a phone's keyboard stays closed.
  initialFocus?: React.ComponentProps<typeof SheetContent>["initialFocus"];
  children: ReactNode;
}) {
  const narrow = useStep() === "narrow";

  if (narrow) {
    return (
      <PhoneDrawer
        open={open}
        onOpenChange={onOpenChange}
        dismiss="close"
        title={title}
        initialFocus={initialFocus}
      >
        {children}
      </PhoneDrawer>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        initialFocus={initialFocus}
        className="w-[380px] max-w-[calc(100%-2rem)] gap-0 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] data-[side=right]:sm:max-w-[380px]"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <PanelHeader title={title} onClose={() => onOpenChange(false)} closeLabel={closeLabel} />
        <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ohmtools/design: shadcn/src/components/ohmtools/page-editor.tsx (copied by `ohmtools-design add`, do not edit)
import { useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorSheet } from "@/components/ohmtools/editor-sheet";
import { useStep } from "@/lib/ohmtools/steps";

// The element group "Editing in the page" (DESIGN.md, "Which group"): the
// point of the view, changed often, taking effect at once (faltung's
// formulas). Where it `fits` (at most two lines, what it changes stays in
// sight), the editor stands in the page; where not, the page shows the
// `summary` with an edit button that opens the editor in a drawer (phones)
// or a sheet from the right (compact). `fits` defaults to wide screens.
export function PageEditor({
  fits,
  title,
  summary,
  editLabel,
  closeLabel = "Close",
  children,
}: {
  fits?: boolean;
  // The editor's heading where it opens over the page ("Functions").
  title: string;
  // What is set now, shown where the editor does not fit.
  summary: ReactNode;
  // The edit button's label ("Edit").
  editLabel: string;
  closeLabel?: string;
  // The editor; the same in the page and over it.
  children: ReactNode;
}) {
  const step = useStep();
  const [open, setOpen] = useState(false);
  if (fits ?? step === "wide") return children;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">{summary}</div>
        <Button variant="outline" className="h-10 compact:h-9" onClick={() => setOpen(true)}>
          <Pencil data-icon="inline-start" />
          {editLabel}
        </Button>
      </div>
      <EditorSheet open={open} onOpenChange={setOpen} title={title} closeLabel={closeLabel}>
        {children}
      </EditorSheet>
    </>
  );
}

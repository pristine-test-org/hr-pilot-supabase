import { Loader2 } from "lucide-react";

/** Shown in place of a page's data while it loads (or if it failed to). */
export function PageState({ error }: { error?: string }) {
  if (error) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-sm text-destructive">{error}</div>
    );
  }
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  );
}

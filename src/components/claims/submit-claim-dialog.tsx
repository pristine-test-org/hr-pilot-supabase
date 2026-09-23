import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { describeError, supabase, type ClaimCategory } from "@/lib/supabase";

function validateClaim(amount: number, date: string, description: string) {
  if (!Number.isFinite(amount) || amount <= 0) return "Amount must be greater than zero.";
  if (amount > 100000) return "Amount must be RM 100,000 or less.";
  if (!date || Number.isNaN(Date.parse(date))) return "Please provide a valid date.";
  const trimmed = description.trim();
  if (trimmed.length < 3) return "Please provide a short description.";
  if (trimmed.length > 500) return "Description must be 500 characters or fewer.";
  return null;
}

const CLAIM_CATEGORIES = [
  { value: "FOOD", label: "Food" },
  { value: "TRAVEL", label: "Travel" },
  { value: "MEDICAL", label: "Medical" },
  { value: "OTHER", label: "Other" },
];

export function SubmitClaimDialog({ onSubmitted }: { onSubmitted?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ClaimCategory>("FOOD");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  function resetForm() {
    setCategory("FOOD");
    setAmount("");
    setDate("");
    setDescription("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const invalid = validateClaim(Number(amount), date, description);
      if (invalid) {
        setError(invalid);
        return;
      }

      // user_id, status and decision fields are set by the database, not the browser.
      const { error: insertError } = await supabase.from("claims").insert({
        category,
        amount: Number(amount),
        date,
        description: description.trim(),
      });

      if (insertError) {
        setError(describeError(insertError, "Unable to submit claim."));
        return;
      }

      toast.success("Claim submitted for approval.");
      setOpen(false);
      resetForm();
      onSubmitted?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Submit a claim
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit an expense claim</DialogTitle>
            <DialogDescription>
              Claim back food, travel, medical or other work-related expenses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="claim-category">Category</Label>
              <Select items={CLAIM_CATEGORIES} value={category} onValueChange={(value) => setCategory((value as ClaimCategory | null) ?? "FOOD")}>
                <SelectTrigger id="claim-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_CATEGORIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="claim-amount">Amount (RM)</Label>
                <Input
                  id="claim-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-date">Date</Label>
                <Input
                  id="claim-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="claim-description">Description</Label>
              <Textarea
                id="claim-description"
                placeholder="What was this expense for?"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit claim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

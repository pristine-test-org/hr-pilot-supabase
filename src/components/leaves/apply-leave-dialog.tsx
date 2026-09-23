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
import { describeError, supabase, type LeaveType } from "@/lib/supabase";

function validateLeave(startDate: string, endDate: string, reason: string) {
  const trimmed = reason.trim();
  if (trimmed.length < 3) return "Please provide a short reason.";
  if (trimmed.length > 500) return "Reason must be 500 characters or fewer.";
  if (!startDate || !endDate || Number.isNaN(Date.parse(startDate)) || Number.isNaN(Date.parse(endDate))) {
    return "Please provide valid dates.";
  }
  if (endDate < startDate) return "End date must be on or after the start date.";
  return null;
}

const LEAVE_TYPES = [
  { value: "ANNUAL", label: "Annual leave" },
  { value: "SICK", label: "Sick leave" },
  { value: "UNPAID", label: "Unpaid leave" },
];

export function ApplyLeaveDialog({ onSubmitted }: { onSubmitted?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<LeaveType>("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  function resetForm() {
    setType("ANNUAL");
    setStartDate("");
    setEndDate("");
    setReason("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const invalid = validateLeave(startDate, endDate, reason);
      if (invalid) {
        setError(invalid);
        return;
      }

      // user_id, status, day count and decision fields are set by the database, not the browser.
      const { error: insertError } = await supabase.from("leave_requests").insert({
        type,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      if (insertError) {
        setError(describeError(insertError, "Unable to submit leave request."));
        return;
      }

      toast.success("Leave request submitted for approval.");
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
        Apply for leave
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply for leave</DialogTitle>
            <DialogDescription>
              Submit a new leave request. Your admin will review and approve or reject it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leave-type">Leave type</Label>
              <Select items={LEAVE_TYPES} value={type} onValueChange={(value) => setType((value as LeaveType | null) ?? "ANNUAL")}>
                <SelectTrigger id="leave-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Let your admin know why you're taking leave"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
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
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

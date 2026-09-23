import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useCurrentUser } from "@/lib/auth";
import { describeError, supabase } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function ProfileForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const user = useCurrentUser();
  const { refreshProfile } = useAuth();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      if (trimmedName.length < 2) {
        setError("Name must be at least 2 characters.");
        return;
      }
      if (trimmedName.length > 100) {
        setError("Name must be 100 characters or fewer.");
        return;
      }
      if (!EMAIL_PATTERN.test(trimmedEmail)) {
        setError("Please provide a valid email address.");
        return;
      }

      // Only name and email: the database refuses changes to any other column from an employee.
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ name: trimmedName, email: trimmedEmail })
        .eq("id", user.id)
        .select("id")
        .single();

      if (updateError) {
        setError(describeError(updateError, "Unable to update profile."));
        return;
      }

      toast.success("Profile updated.");
      await refreshProfile();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your name and email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

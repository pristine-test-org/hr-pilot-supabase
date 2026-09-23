import { useCurrentUser } from "@/lib/auth";
import { formatDate, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";

export default function SettingsPage() {
  const user = useCurrentUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile and account security.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work information</CardTitle>
          <CardDescription>Managed by HR - reach out to your admin to make changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="font-mono text-sm font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Job title</p>
                <p className="text-sm font-medium">{user.job_title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{user.department}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date joined</p>
                <p className="text-sm font-medium">{formatDate(user.date_joined)}</p>
              </div>
            </div>
            {user.role === "ADMIN" && <Badge>Admin</Badge>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileForm initialName={user.name} initialEmail={user.email} />
        <PasswordForm />
      </div>
    </div>
  );
}

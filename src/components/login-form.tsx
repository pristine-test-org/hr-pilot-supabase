import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  { label: "Admin (HR)", username: "admin", password: "admin" },
  { label: "Employee", username: "ahmad.faiz", password: "password123" },
];

export function LoginForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!username.trim() || !password) {
      setError("Username and password are required.");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn(username, password);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setUsername(account.username);
    setPassword(account.password);
    setError(null);
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="login-well">
        <div className="login-head">
          <div className="login-mark" aria-hidden="true">
            HP
          </div>
          <h2 className="login-title">Welcome back</h2>
          <p className="login-lede">Log in to your HR Pilot workspace</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="login-instrument">
            <div className="login-line">
              <label className="login-k" htmlFor="username">
                User
              </label>
              <input
                id="username"
                className="login-user"
                autoComplete="username"
                placeholder="e.g. ahmad.faiz"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="login-pass">
              <div className="login-pass-inner">
                <div className="login-line">
                  <label className="login-k" htmlFor="password">
                    Pass
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </button>
        </form>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4 text-sm">
        <p className="mb-1 font-medium">Demo credentials</p>
        <p className="mb-3 text-xs text-muted-foreground">
          This is a practice app with simple authentication - click a card below to autofill.
        </p>
        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.username}
              type="button"
              onClick={() => fillDemo(account)}
              className="flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="font-medium">{account.label}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {account.username} / {account.password}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

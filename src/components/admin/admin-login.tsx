import { useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export function AdminLogin() {
  const { signIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setErr(error);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <div className="text-[10px] uppercase tracking-[0.32em] font-mono text-muted-foreground">
            NICKY BOY / Admin
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-muted-foreground mb-6">Restricted access. Authorized operators only.</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs uppercase tracking-wider">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 bg-background/40 border-border/70 h-11"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs uppercase tracking-wider">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 bg-background/40 border-border/70 h-11"
            />
          </div>
          {err && (
            <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 rounded px-3 py-2">
              {err}
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full h-11">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}

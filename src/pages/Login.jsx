import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, User, Lock, Loader2, Radio } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useMyBBAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("mybbAuth", { username, password });
      if (res.data?.success) {
        login(res.data.user);
        window.location.href = "/";
      } else {
        setError(res.data?.error || "Invalid username or password");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in with your Insomniacs GMRS forum account"
    >
      {error && (
        <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-base font-semibold text-foreground">Forum Username</Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="Your forum username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-12 h-14 text-base rounded-xl border-border/60 focus:border-violet-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-semibold text-foreground">Password</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 h-14 text-base rounded-xl border-border/60 focus:border-violet-500"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-14 text-base font-bold rounded-xl mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Radio className="w-5 h-5 mr-2" />
              Sign In
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border/40 text-center">
        <p className="text-sm text-muted-foreground mb-2">Don't have an account yet?</p>
        <a
          href="https://insomniacsgmrs.com/member.php?action=register"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full py-3.5 rounded-xl border border-violet-500/40 text-violet-400 font-semibold text-base hover:bg-violet-500/10 transition-colors"
        >
          Register on the Forum
        </a>
      </div>
    </AuthLayout>
  );
}
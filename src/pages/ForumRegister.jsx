import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Radio, CheckCircle2, AlertCircle } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

export default function ForumRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", callsign: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError("Full name, email, and password are required.");
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke("registerMyBBUser", {
      username: form.username,
      email: form.email,
      password: form.password,
      callsign: form.callsign,
    });
    setLoading(false);
    if (res.data?.success) {
      setSuccess(true);
    } else {
      setError(res.data?.error || "Registration failed. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">You're registered!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your Insomniacs GMRS forum account has been created. You can now log in at the forum.
        </p>
        <a
          href="https://insomniacsgmrs.com/member.php?action=login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors mb-3"
        >
          Log in to Forum
        </a>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to app
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-violet-400 hover:text-violet-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground">Join the Community</h1>
      </div>

      <div className="flex-1 px-5 py-8 flex flex-col items-center">
        {/* Branding */}
        <img src={LOGO_URL} alt="Insomniacs GMRS" className="h-16 w-auto object-contain mb-2" />
        <p className="text-xs text-muted-foreground mb-8 text-center">
          Create your Insomniacs GMRS forum account
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
            <Input
              name="username"
              placeholder="John Smith"
              value={form.username}
              onChange={handleChange}
              className="bg-white/[0.04] border-white/[0.1]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="bg-white/[0.04] border-white/[0.1]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
            <Input
              name="password"
              type="password"
              placeholder="Choose a strong password"
              value={form.password}
              onChange={handleChange}
              className="bg-white/[0.04] border-white/[0.1]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              GMRS Callsign <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <div className="relative">
              <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="callsign"
                placeholder="e.g. WRXX123"
                value={form.callsign}
                onChange={handleChange}
                className="pl-9 bg-white/[0.04] border-white/[0.1] uppercase"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              "Create Forum Account"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <a
              href="https://insomniacsgmrs.com/member.php?action=login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300"
            >
              Log in at the forum
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
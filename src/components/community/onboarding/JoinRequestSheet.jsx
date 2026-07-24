import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { X, Loader2, KeyRound, MessageSquare, Lock, Check } from "lucide-react";

/**
 * Bottom sheet for joining a private community.
 * Lets the user either attach an optional note to their join request, or
 * enter an invite code for instant access.
 */
export default function JoinRequestSheet({ community, onClose, onJoined }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!community) return null;

  const submit = async (withCode) => {
    setLoading(true);
    try {
      const payload = { action: "request", community_id: community.id };
      if (reason.trim()) payload.reason = reason.trim();
      if (withCode && code.trim()) payload.invite_code = code.trim();

      const res = await base44.functions.invoke("manageCommunityMembership", payload);
      if (res.data?.success) {
        if (res.data.status === "active") {
          toast({ title: "Welcome aboard!", description: `You joined ${community.name}.` });
          localStorage.setItem("selected_community_id", community.id);
          localStorage.setItem("selected_community_name", community.name);
          localStorage.removeItem("onboarding_skipped");
          await qc.invalidateQueries({ queryKey: ["user-communities"] });
          await qc.invalidateQueries({ queryKey: ["my-memberships-all"] });
          onJoined?.(community, "active");
        } else {
          toast({ title: "Request sent", description: `Your request to join ${community.name} is pending approval.` });
          await qc.invalidateQueries({ queryKey: ["my-memberships-all"] });
          onJoined?.(community, "pending");
        }
      } else {
        toast({ title: "Couldn't join", description: res.data?.error || "Try again later.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 sheet-up relative"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-foreground">Join {community.name}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          This is a private community. Send a join request to the admins, or use an invite code for instant access.
        </p>

        {/* Invite code — instant access */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
            <KeyRound className="w-3.5 h-3.5 text-primary" /> Invite Code (instant access)
          </label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter invite code"
              className="flex-1 px-3 py-2.5 rounded-xl bg-card/60 border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 font-mono"
            />
            <button
              onClick={() => submit(true)}
              disabled={loading || !code.trim()}
              className="px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Join
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or send a request</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Optional note to admins */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /> Note to admins (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Introduce yourself — why do you want to join?"
            rows={3}
            maxLength={300}
            className="w-full px-3 py-2.5 rounded-xl bg-card/60 border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right mt-1">{reason.length}/300</p>
        </div>

        <button
          onClick={() => submit(false)}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Send Join Request
        </button>
      </div>
    </div>
  );
}
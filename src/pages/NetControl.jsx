import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Radio, Plus, Trash2, ClipboardList, Signal, FileText, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { format } from "date-fns";

const SIGNAL_PRESETS = ["5x5", "5x4", "5x3", "4x4", "4x3", "3x3", "Q5", "Q4", "Q3"];

export default function NetControl() {
  const { netId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({ callsign: "", signal_report: "5x5", location: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(null); // callsign flashed on success

  const { data: net } = useQuery({
    queryKey: ["net", netId],
    queryFn: async () => {
      const nets = await base44.entities.Net.filter({ id: netId });
      return nets[0] || null;
    },
    enabled: !!netId,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins", netId],
    queryFn: () => base44.entities.NetCheckIn.filter({ net_id: netId }),
    refetchInterval: 10000,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      base44.entities.NetCheckIn.create({
        net_id: netId,
        net_name: net?.name || "",
        callsign: form.callsign.trim().toUpperCase(),
        location: form.location.trim(),
        signal_report: form.signal_report,
        notes: form.notes.trim(),
      }),
    onSuccess: () => {
      setFlash(form.callsign.trim().toUpperCase());
      setTimeout(() => setFlash(null), 2000);
      setForm((f) => ({ ...f, callsign: "", location: "", notes: "" }));
      qc.invalidateQueries({ queryKey: ["checkins", netId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.NetCheckIn.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins", netId] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.callsign.trim()) return;
    addMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Net Control"
        showBack
        rightAction={
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">{checkIns.length} on air</span>
          </div>
        }
      />

      <div className="px-4 space-y-4 pt-3">
        {/* Net info */}
        {net && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{net.name}</p>
              <p className="text-xs text-muted-foreground">{net.time} · {net.frequency} MHz</p>
            </div>
          </div>
        )}

        {/* Check-in form */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-400" />
            Log Check-In
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Callsign */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block flex items-center gap-1">
                <User className="w-3 h-3" /> Callsign *
              </label>
              <Input
                value={form.callsign}
                onChange={(e) => setForm((f) => ({ ...f, callsign: e.target.value.toUpperCase() }))}
                placeholder="e.g. WRXX123"
                className="h-10 bg-background/50 uppercase font-mono tracking-wider text-sm"
                autoCapitalize="characters"
              />
            </div>

            {/* Signal Report */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block flex items-center gap-1">
                <Signal className="w-3 h-3" /> Signal Report
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SIGNAL_PRESETS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm((f) => ({ ...f, signal_report: s }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                      form.signal_report === s
                        ? "bg-violet-600 text-white"
                        : "bg-white/[0.05] text-muted-foreground border border-white/[0.08] hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Input
                value={form.signal_report}
                onChange={(e) => setForm((f) => ({ ...f, signal_report: e.target.value }))}
                placeholder="Custom signal report"
                className="h-9 bg-background/50 font-mono text-sm"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">
                Location <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, State"
                className="h-9 bg-background/50 text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block flex items-center gap-1">
                <FileText className="w-3 h-3" /> Notes <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Traffic, comments..."
                rows={2}
                className="w-full bg-background/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 resize-none transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={!form.callsign.trim() || addMutation.isPending}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {addMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Logging...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Log Check-In
                </span>
              )}
            </Button>

            {flash && (
              <div className="text-center text-sm text-emerald-400 font-semibold animate-pulse">
                ✓ {flash} checked in!
              </div>
            )}
          </form>
        </div>

        {/* Roster */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-violet-400" />
              Roster
            </h3>
            <span className="text-xs text-muted-foreground">{checkIns.length} stations</span>
          </div>

          {checkIns.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No check-ins yet</p>
          ) : (
            <div className="space-y-1.5">
              {checkIns.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg bg-background/40 border border-white/[0.05]"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0 mt-0.5 font-mono">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground font-mono">{c.callsign}</span>
                        <span className="text-xs text-violet-400 font-mono font-medium bg-violet-500/10 px-1.5 py-0.5 rounded">
                          {c.signal_report}
                        </span>
                        {c.location && (
                          <span className="text-xs text-muted-foreground">{c.location}</span>
                        )}
                      </div>
                      {c.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{c.notes}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {c.created_date && format(new Date(c.created_date), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(c.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
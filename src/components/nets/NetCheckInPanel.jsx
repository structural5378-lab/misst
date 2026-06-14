import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Radio, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";

export default function NetCheckInPanel({ net }) {
  const [user, setUser] = useState(null);
  const { mybbUser } = useMyBBAuth();
  const [showForm, setShowForm] = useState(false);
  const [signalReport, setSignalReport] = useState("5x5");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins", net.id],
    queryFn: () => base44.entities.NetCheckIn.filter({ net_id: net.id }),
    refetchInterval: 15000, // live refresh every 15s
  });

  const myCheckIn = checkIns.find((c) => c.user_id === user?.id);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const callsign = mybbUser?.username || user?.callsign || "UNKNOWN";
      const location = user?.location || mybbUser?.location || "";
      // Save check-in record
      await base44.entities.NetCheckIn.create({
        net_id: net.id,
        net_name: net.name,
        user_id: user?.id,
        callsign,
        location,
        signal_report: signalReport,
        notes,
      });
      // Post to forum
      await base44.functions.invoke("fetchMyBBForums", {
        action: "post_checkin",
        net_name: net.name,
        callsign,
        location,
        signal_report: signalReport,
        notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkins", net.id] });
      setShowForm(false);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => base44.entities.NetCheckIn.delete(myCheckIn.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins", net.id] }),
  });

  return (
    <div id={`checkin-${net.id}`} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-foreground">Online Check-Ins</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">{checkIns.length} on air</span>
        </div>
      </div>

      {/* Check-in list */}
      {checkIns.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {checkIns.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-background/40">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="font-semibold text-foreground">{c.callsign}</span>
                {c.location && <span className="text-muted-foreground">{c.location}</span>}
              </div>
              <span className="text-muted-foreground">{c.signal_report}</span>
            </div>
          ))}
        </div>
      )}

      {/* My check-in actions */}
      {myCheckIn ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">You're checked in as {myCheckIn.callsign}</span>
          </div>
          <button
            onClick={() => checkOutMutation.mutate()}
            className="text-xs text-red-400 hover:text-red-300 font-medium"
          >
            Check Out
          </button>
        </div>
      ) : showForm ? (
        <div className="space-y-2">
          <Input
            placeholder="Signal report (e.g. 5x5)"
            value={signalReport}
            onChange={(e) => setSignalReport(e.target.value)}
            className="h-9 bg-background/50 text-sm"
          />
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-9 bg-background/50 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs"
              onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
            >
              {checkInMutation.isPending ? "Checking in..." : "Check In"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs text-muted-foreground">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          className="w-full bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 text-xs"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Online Check-In
        </Button>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, Plus, CheckCircle, XCircle, Clock, Users, Send, StopCircle } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import NetCheckinForm from "@/components/nets/NetCheckinForm";
import NetCheckinList from "@/components/nets/NetCheckinList";

export default function NetControl() {
  const { netId } = useParams();
  const navigate = useNavigate();
  const { mybbUser } = useMistUser();
  const queryClient = useQueryClient();

  const isAuthorized = mybbUser?.role === "admin" || mybbUser?.role === "moderator";

  const [activeSession, setActiveSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);

  const { data: net } = useQuery({
    queryKey: ["net", netId],
    queryFn: () => base44.entities.Net.filter({ id: netId }),
    select: d => d[0],
    enabled: !!netId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["net-sessions", netId],
    queryFn: () => base44.entities.NetSession.filter({ net_id: netId }, "-started_at", 10),
  });

  const { data: checkins = [], refetch: refetchCheckins } = useQuery({
    queryKey: ["net-log", activeSession?.id],
    queryFn: () => base44.entities.NetLog.filter({ session_id: activeSession.id }, "checkin_number", 100),
    enabled: !!activeSession?.id,
  });

  // Real-time check-in updates via subscription instead of 5s polling
  useEffect(() => {
    const unsubscribe = base44.entities.NetLog.subscribe((event) => {
      if (event.type === "create" && activeSession?.id) {
        queryClient.invalidateQueries({ queryKey: ["net-log", activeSession.id] });
      }
    });
    return unsubscribe;
  }, [activeSession?.id, queryClient]);

  useEffect(() => {
    const active = sessions.find(s => s.status === "active");
    setActiveSession(active || null);
  }, [sessions]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground text-sm mt-1">Net Control is restricted to admins and moderators.</p>
          <Button className="mt-4" onClick={() => navigate("/nets")}>Back to Nets</Button>
        </div>
      </div>
    );
  }

  const startSession = async () => {
    if (!net) return;
    setStarting(true);
    const session = await base44.entities.NetSession.create({
      net_id: netId,
      net_name: net.name,
      frequency: net.frequency,
      net_control: mybbUser.username,
      net_control_uid: mybbUser.uid,
      status: "active",
      started_at: new Date().toISOString(),
      checkin_count: 0,
    });
    queryClient.invalidateQueries({ queryKey: ["net-sessions", netId] });
    setActiveSession(session);
    setStarting(false);
  };

  const handleCheckin = async (data) => {
    const count = checkins.length + 1;
    await base44.entities.NetLog.create({
      session_id: activeSession.id,
      net_name: activeSession.net_name,
      callsign: data.callsign.toUpperCase(),
      location: data.location || "",
      signal_report: data.signal_report || "",
      notes: data.notes || "",
      checkin_number: count,
    });
    await base44.entities.NetSession.update(activeSession.id, { checkin_count: count });
    refetchCheckins();
    setShowCheckinForm(false);
  };

  const endSession = async () => {
    if (!activeSession) return;
    setEnding(true);
    await base44.entities.NetSession.update(activeSession.id, {
      status: "closed",
      ended_at: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["net-sessions", netId] });
    setActiveSession(null);
    setEnding(false);
  };

  const postToForum = async (session) => {
    const logs = await base44.entities.NetLog.filter({ session_id: session.id }, "checkin_number", 200);
    const started = session.started_at ? format(new Date(session.started_at), "MMM d, yyyy h:mm a") : "Unknown";
    const ended = session.ended_at ? format(new Date(session.ended_at), "h:mm a") : "Unknown";

    const rows = logs.map(l =>
      `#${l.checkin_number} | ${l.callsign} | ${l.location || "-"} | ${l.signal_report || "-"} | ${l.notes || "-"}`
    ).join("\n");

    const message = `[b]Net Session Log[/b]\n[b]Net:[/b] ${session.net_name}\n[b]Frequency:[/b] ${session.frequency} MHz\n[b]Net Control:[/b] ${session.net_control}\n[b]Date:[/b] ${started} – ${ended}\n[b]Total Check-ins:[/b] ${logs.length}\n\n[code]#  | Callsign | Location | Signal | Notes\n${rows}[/code]\n\n73 de ${session.net_control}`;

    setPosting(true);
    const res = await base44.functions.invoke("fetchMyBBForums", {
      action: "create_thread",
      fid: 18,
      subject: `Net Log: ${session.net_name} – ${started}`,
      message,
      bot_username: session.net_control,
    });
    if (res.data?.tid) {
      await base44.entities.NetSession.update(session.id, { forum_thread_id: String(res.data.tid) });
      queryClient.invalidateQueries({ queryKey: ["net-sessions", netId] });
    }
    setPosting(false);
  };

  const displaySession = activeSession || sessions[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="📻 Net Control" showBack />

      <div className="px-4 py-4 space-y-4">
        {/* Net info */}
        {net && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Radio className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">{net.name}</h2>
                <p className="text-xs text-muted-foreground">{net.frequency} MHz · {net.time}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active session controls */}
        {activeSession ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-400">Session Active</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {activeSession.started_at && format(new Date(activeSession.started_at), "h:mm a")}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{checkins.length} stations checked in</span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCheckinForm(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" /> Log Check-in
              </Button>
              <Button
                onClick={endSession}
                disabled={ending}
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                <StopCircle className="w-4 h-4 mr-1" /> End Net
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={startSession}
            disabled={starting}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 text-base font-semibold rounded-2xl"
          >
            <Radio className="w-5 h-5 mr-2" />
            {starting ? "Starting…" : "Start Net Session"}
          </Button>
        )}

        {/* Check-in form */}
        {showCheckinForm && (
          <NetCheckinForm
            onSubmit={handleCheckin}
            onCancel={() => setShowCheckinForm(false)}
          />
        )}

        {/* Live check-in list */}
        {activeSession && checkins.length > 0 && (
          <NetCheckinList checkins={checkins} />
        )}

        {/* Past sessions */}
        {sessions.filter(s => s.status === "closed").length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Past Sessions</h3>
            <div className="space-y-2">
              {sessions.filter(s => s.status === "closed").map(session => (
                <div key={session.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.started_at && format(new Date(session.started_at), "MMM d, yyyy h:mm a")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {session.checkin_count} check-ins · NCS: {session.net_control}
                      </p>
                    </div>
                    {session.forum_thread_id ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Posted
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={posting}
                        onClick={() => postToForum(session)}
                        className="h-7 text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300"
                      >
                        <Send className="w-3 h-3 mr-1" /> Post to Forum
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
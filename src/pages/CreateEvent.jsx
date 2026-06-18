import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, AlarmClock, Loader2 } from "lucide-react";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { mybbUser } = useMyBBAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [delay30, setDelay30] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !eventTime) {
      toast({ title: "Missing fields", description: "Please fill in the title and event time.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const baseTime = new Date(eventTime);
      const effectiveTime = delay30
        ? new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString()
        : baseTime.toISOString();

      const event = await base44.entities.Event.create({
        title,
        description,
        location,
        event_time: effectiveTime,
        created_by: mybbUser?.username || "Admin",
        status: delay30 ? "delayed" : "upcoming",
        delayed_until: delay30 ? effectiveTime : null,
        reminders_sent: 0,
        notification_sent: false,
      });

      // Send immediate push notification
      await base44.functions.invoke("sendEventNotification", {
        eventId: event.id,
        title: event.title,
        description: event.description,
        eventTime: effectiveTime,
        type: "created",
      });

      toast({ title: "Event created!", description: delay30 ? "Start delayed by 30 minutes. Reminders will be sent every 10 minutes." : "Event posted. Reminders will be sent every 10 minutes before start." });
      navigate("/");
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Create Event" showBack />
      <div className="px-4 pt-4 space-y-4 pb-8">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monthly GMRS Net"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's happening at this event?"
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. 462.550 MHz / Repeater K4MIA"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Date/Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Event Date & Time *
          </label>
          <input
            type="datetime-local"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Delay 30 min toggle */}
        <button
          onClick={() => setDelay30(!delay30)}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
            delay30
              ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
              : "bg-card border-border text-muted-foreground"
          }`}
        >
          <AlarmClock className="w-5 h-5 shrink-0" />
          <div className="text-left flex-1">
            <p className="text-sm font-semibold">Delay Start by 30 Minutes</p>
            <p className="text-xs mt-0.5 opacity-75">
              {delay30 ? "Start time will be pushed back 30 min from what you entered" : "Tap to delay event start by 30 minutes"}
            </p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${delay30 ? "bg-amber-500 border-amber-500" : "border-muted-foreground"}`}>
            {delay30 && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </button>

        {/* Info card */}
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 space-y-1">
          <p className="font-semibold">📢 Push Notifications</p>
          <p>Members will be notified immediately when you create this event, then every 10 minutes leading up to the start time — even if they don't have the app open.</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 text-sm font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? "Creating..." : "Create Event & Notify Members"}
        </Button>
      </div>
    </div>
  );
}
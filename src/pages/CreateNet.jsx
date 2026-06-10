import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORIES = ["general", "emergency", "technical", "social", "training"];

export default function CreateNet() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    schedule: "",
    time: "",
    day_of_week: "",
    frequency: "",
    repeater_callsign: "",
    net_control: "",
    category: "general",
  });

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    if (!form.name || !form.frequency) return;
    setSaving(true);
    const net = await base44.entities.Net.create(form);
    // Post to forum if possible
    try {
      await base44.functions.invoke("fetchMyBBForums", {
        action: "post_net_schedule",
        net_name: net.name,
        frequency: net.frequency,
        time: net.time,
        day_of_week: net.day_of_week,
        description: net.description,
        repeater_callsign: net.repeater_callsign,
        net_control: net.net_control,
      });
    } catch (e) {
      // Forum post is optional
    }
    setSaving(false);
    navigate("/nets");
  };

  return (
    <div>
      <PageHeader title="Create Net" showBack />
      <div className="px-4 pt-4 space-y-4 pb-8">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Net Name *</label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Insomniacs Evening Net"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of the net..."
              className="h-20"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Frequency (MHz) *</label>
            <Input
              type="number"
              step="0.0001"
              value={form.frequency}
              onChange={(e) => set("frequency", e.target.value)}
              placeholder="e.g. 462.550"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Repeater Callsign</label>
            <Input
              value={form.repeater_callsign}
              onChange={(e) => set("repeater_callsign", e.target.value)}
              placeholder="e.g. K4MIA"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Day of Week</label>
            <Select value={form.day_of_week} onValueChange={(v) => set("day_of_week", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select day..." />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Time</label>
            <Input
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              placeholder="e.g. 9:00 PM EST"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Schedule</label>
            <Input
              value={form.schedule}
              onChange={(e) => set("schedule", e.target.value)}
              placeholder="e.g. Weekly, Daily, Mon/Wed/Fri"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Net Control</label>
            <Input
              value={form.net_control}
              onChange={(e) => set("net_control", e.target.value)}
              placeholder="Callsign of net control operator"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category</label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          onClick={handleSubmit}
          disabled={saving || !form.name || !form.frequency}
        >
          {saving ? "Creating..." : "Create Net"}
        </Button>
      </div>
    </div>
  );
}
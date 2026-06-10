import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";

const statusOptions = ["online", "offline", "busy"];

export default function AddRepeater() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    callsign: "",
    frequency: "",
    offset: "",
    tone: "",
    location: "",
    owner_callsign: "",
    description: "",
    status: "online",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.callsign || !form.frequency) return;
    setSaving(true);
    await base44.entities.Repeater.create({
      ...form,
      frequency: parseFloat(form.frequency),
    });
    navigate("/repeaters");
  };

  return (
    <div>
      <PageHeader title="Add Repeater" showBack />
      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-3 pb-8">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Callsign *</label>
          <Input name="callsign" value={form.callsign} onChange={handleChange} placeholder="e.g. K4MIA" required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Frequency (MHz) *</label>
          <Input name="frequency" type="number" step="0.001" value={form.frequency} onChange={handleChange} placeholder="e.g. 462.550" required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Offset</label>
          <Input name="offset" value={form.offset} onChange={handleChange} placeholder="e.g. +5.0 MHz" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">PL Tone</label>
          <Input name="tone" value={form.tone} onChange={handleChange} placeholder="e.g. 141.3" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Location</label>
          <Input name="location" value={form.location} onChange={handleChange} placeholder="City, State" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Owner Callsign</label>
          <Input name="owner_callsign" value={form.owner_callsign} onChange={handleChange} placeholder="e.g. W4XYZ" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s} className="bg-card">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <Input name="description" value={form.description} onChange={handleChange} placeholder="Optional notes" />
        </div>
        <Button type="submit" disabled={saving} className="w-full h-11 rounded-xl mt-2">
          {saving ? "Saving..." : "Add Repeater"}
        </Button>
      </form>
    </div>
  );
}
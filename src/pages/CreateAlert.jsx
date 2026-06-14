import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const alertTypes = [
  { value: "info", label: "Info", color: "bg-primary/10 text-primary border-primary/30" },
  { value: "warning", label: "Warning", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { value: "emergency", label: "Emergency", color: "bg-red-500/10 text-red-400 border-red-500/30" },
  { value: "system", label: "System", color: "bg-muted text-muted-foreground border-border" },
];

export default function CreateAlert() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const alert = await base44.entities.Alert.create({
      title: title.trim(),
      message: message.trim() || undefined,
      type,
      link: link.trim() || undefined,
      is_read: false,
    });
    // Fire push notification
    await base44.functions.invoke("sendAlertNotification", { data: alert });
    navigate("/alerts");
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Post Alert" showBack />
      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4 pb-8">

        {/* Type selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Alert Type</label>
          <div className="grid grid-cols-2 gap-2">
            {alertTypes.map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${color} ${
                  type === value ? "ring-2 ring-white/20 scale-[0.98]" : "opacity-50 hover:opacity-80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Alert title..."
            required
            className="w-full bg-secondary/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional details..."
            rows={4}
            className="w-full bg-secondary/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Link */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Link (optional)</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-secondary/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        <Button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2 h-11"
        >
          <Bell className="w-4 h-4" />
          {saving ? "Posting..." : "Post Alert"}
        </Button>
      </form>
    </div>
  );
}
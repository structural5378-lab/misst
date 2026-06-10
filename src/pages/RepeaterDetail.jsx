import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, MapPin, Star, Pencil, Trash2, Check, X } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";

const statusOptions = ["online", "offline", "busy"];

export default function RepeaterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mybbUser } = useMyBBAuth();
  const canEdit = mybbUser?.canEdit;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: repeater, isLoading } = useQuery({
    queryKey: ["repeater", id],
    queryFn: async () => {
      const list = await base44.entities.Repeater.filter({ id });
      return list[0];
    },
  });

  const startEdit = () => {
    setForm({ ...repeater });
    setEditing(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Repeater.update(id, {
      ...form,
      frequency: parseFloat(form.frequency),
    });
    queryClient.invalidateQueries({ queryKey: ["repeater", id] });
    queryClient.invalidateQueries({ queryKey: ["repeaters"] });
    setEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this repeater?")) return;
    setDeleting(true);
    await base44.entities.Repeater.delete(id);
    queryClient.invalidateQueries({ queryKey: ["repeaters"] });
    navigate("/repeaters");
  };

  const handleFavorite = async () => {
    await base44.entities.Repeater.update(id, { is_favorite: !repeater.is_favorite });
    queryClient.invalidateQueries({ queryKey: ["repeater", id] });
    queryClient.invalidateQueries({ queryKey: ["repeaters"] });
  };

  if (isLoading || !repeater) {
    return (
      <div>
        <PageHeader title="Repeater" showBack />
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const data = editing ? form : repeater;

  return (
    <div>
      <PageHeader
        title={repeater.callsign}
        showBack
        rightAction={
          canEdit && (
            <div className="flex items-center gap-1">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="p-2 text-emerald-400 hover:text-emerald-300">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditing(false)} className="p-2 text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={startEdit} className="p-2 text-violet-400 hover:text-violet-300">
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="p-2 text-red-400 hover:text-red-300">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )
        }
      />
      <div className="px-4 pt-4 space-y-4 pb-8">
        {/* Hero */}
        <div className="relative w-full h-48 rounded-2xl bg-secondary/50 overflow-hidden flex items-center justify-center">
          {repeater.image_url ? (
            <img src={repeater.image_url} alt={repeater.callsign} className="w-full h-full object-cover" />
          ) : (
            <Radio className="w-16 h-16 text-primary/30" />
          )}
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            {editing ? (
              <Input name="callsign" value={form.callsign} onChange={handleChange} className="text-lg font-bold w-40" />
            ) : (
              <h2 className="text-lg font-bold text-foreground">{repeater.callsign} Repeater</h2>
            )}
            {editing ? (
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="bg-card">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            ) : (
              <StatusBadge status={repeater.status || "online"} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Frequency", name: "frequency", display: `${repeater.frequency?.toFixed(3)} MHz`, type: "number", step: "0.001" },
              { label: "Offset", name: "offset", display: repeater.offset || "N/A" },
              { label: "PL Tone", name: "tone", display: repeater.tone || "None" },
              { label: "Owner", name: "owner_callsign", display: repeater.owner_callsign || "N/A" },
            ].map(({ label, name, display, type, step }) => (
              <div key={name} className="p-3 rounded-xl bg-secondary/50">
                <p className="text-xs text-muted-foreground">{label}</p>
                {editing ? (
                  <Input name={name} value={form[name] || ""} onChange={handleChange} type={type || "text"} step={step} className="h-7 text-sm mt-1 bg-transparent border-border/50" />
                ) : (
                  <p className="text-sm font-semibold text-foreground">{display}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            {editing ? (
              <Input name="location" value={form.location || ""} onChange={handleChange} className="h-7 text-sm bg-transparent border-border/50" />
            ) : (
              <span className="text-sm">{repeater.location || "Unknown"}</span>
            )}
          </div>

          {(repeater.description || editing) && (
            editing ? (
              <Input name="description" value={form.description || ""} onChange={handleChange} placeholder="Description" className="text-sm bg-transparent border-border/50" />
            ) : (
              <p className="text-sm text-muted-foreground">{repeater.description}</p>
            )
          )}
        </div>

        <Button
          onClick={handleFavorite}
          className={`w-full h-11 rounded-xl ${repeater.is_favorite ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "bg-primary/90 hover:bg-primary"}`}
        >
          <Star className={`w-4 h-4 mr-2 ${repeater.is_favorite ? "fill-amber-400" : ""}`} />
          {repeater.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
        </Button>
      </div>
    </div>
  );
}
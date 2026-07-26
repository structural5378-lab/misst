import { useState } from "react";
import { X } from "lucide-react";
import RoomIcon, { ICON_CHOICES } from "./RoomIcon";
import { base44 } from "@/api/base44Client";

const TYPES = [
  { value: "text", label: "Text" },
  { value: "admin", label: "Admin Only" },
  { value: "readonly", label: "Read Only" },
  { value: "emergency", label: "Emergency" },
  { value: "event", label: "Event" },
  { value: "voice", label: "Voice (soon)" },
];

// ManageRoomDialog — create / edit / delete a community room. Admin-gated on
// the backend (manageCommunityRoom verifies community admin role).
export default function ManageRoomDialog({ community, room, user, onClose }) {
  const isEdit = !!room;
  const [name, setName] = useState(room?.name || "");
  const [description, setDescription] = useState(room?.description || "");
  const [icon, setIcon] = useState(room?.icon || "Hash");
  const [type, setType] = useState(room?.type || "text");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.functions.invoke("manageCommunityRoom", {
        action: isEdit ? "update" : "create",
        community_id: community.id,
        room_id: room?.id,
        user_id: user.id,
        user_name: user.full_name || user.email,
        name, description, icon, type,
      });
      onClose();
    } catch (e) {
      alert(e?.message || "Failed to save room");
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm(`Delete "${room.name}"? All messages in this room will be permanently removed.`)) return;
    setSaving(true);
    try {
      await base44.functions.invoke("manageCommunityRoom", { action: "delete", community_id: community.id, room_id: room.id, user_id: user.id });
      onClose();
    } catch (e) {
      alert(e?.message || "Failed to delete room");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 sheet-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{isEdit ? "Edit Room" : "Create Room"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/60"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl bg-secondary/50 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="e.g. Net Coordination" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-xl bg-secondary/50 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="What is this room about?" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Icon</label>
            <div className="mt-1 grid grid-cols-9 gap-1.5">
              {ICON_CHOICES.map((n) => (
                <button key={n} onClick={() => setIcon(n)} className={`aspect-square rounded-lg flex items-center justify-center ${icon === n ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>
                  <RoomIcon name={n} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {TYPES.map((t) => (
                <button key={t.value} onClick={() => setType(t.value)} className={`px-2 py-2 rounded-lg text-xs font-medium ${type === t.value ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <button onClick={save} disabled={saving || !name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create room"}
          </button>
          {isEdit && <button onClick={del} disabled={saving} className="px-4 py-2.5 rounded-xl bg-destructive/15 text-destructive text-sm font-medium">Delete</button>}
        </div>
      </div>
    </div>
  );
}
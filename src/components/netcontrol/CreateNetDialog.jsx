import { useState, useEffect } from "react";
import { mist } from '@/api/mist';
import { useMistUser } from "@/hooks/useMistUser";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORIES = ["general", "emergency", "technical", "social", "training"];

// CreateNetDialog — create/edit a net with the full field set. Saves through
// the guarded manageNet function (create or update). All fields the spec lists
// are present; the schema supports future features (auto start/end, visitor
// check-ins, require callsign, recurring days, timezone, etc.).
export default function CreateNetDialog({ open, editing, onClose, onSaved }) {
  const { mistUser, mybbUser } = useMistUser();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blank());

  useEffect(() => {
    if (editing) {
      const days = (() => { try { return JSON.parse(editing.days || "[]"); } catch { return []; } })();
      setForm({
        name: editing.name || "", description: editing.description || "",
        schedule_type: editing.schedule_type || "recurring",
        days, day_of_week: editing.day_of_week || "",
        time: editing.time || "", timezone: editing.timezone || "America/New_York",
        start_date: editing.start_date || "",
        frequency: editing.frequency || "", offset: editing.offset || "", tone: editing.tone || "",
        repeater_callsign: editing.repeater_callsign || "",
        primary_net_control: editing.primary_net_control || mybbUser?.username || "",
        assistant_net_control: editing.assistant_net_control || "",
        expected_duration_minutes: editing.expected_duration_minutes || "",
        auto_start: !!editing.auto_start, auto_end: !!editing.auto_end,
        allow_visitor_checkins: editing.allow_visitor_checkins !== false,
        require_callsign: editing.require_callsign !== false,
        notes: editing.notes || "", category: editing.category || "general",
      });
    } else {
      setForm(blank(mybbUser?.username || ""));
    }
  }, [editing, mybbUser?.username]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDay = (d) => setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));

  const save = async () => {
    if (!form.name || !form.frequency) return;
    setSaving(true);
    try {
      const payload = { ...form, days: JSON.stringify(form.days), frequency: form.frequency === "" ? "" : Number(form.frequency) };
      if (form.expected_duration_minutes !== "") payload.expected_duration_minutes = Number(form.expected_duration_minutes);
      if (editing?.id) {
        await mist.functions.invoke("manageNet", { action: "update", id: editing.id, ...payload });
      } else {
        await mist.functions.invoke("manageNet", { action: "create", ...payload });
      }
      onSaved?.();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Net" : "Create Net"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Net Name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Evening Net" /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="h-16" /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Schedule Type">
              <Select value={form.schedule_type} onValueChange={(v) => set("schedule_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">Repeating</SelectItem>
                  <SelectItem value="one_time">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          {form.schedule_type === "recurring" ? (
            <Field label="Day(s)">
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDay(d)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${form.days.includes(d) ? "bg-violet-500/20 text-violet-200 border-violet-500/40" : "bg-secondary text-muted-foreground border-border"}`}>{d.slice(0, 3)}</button>
                ))}
              </div>
            </Field>
          ) : (
            <Field label="Date"><Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Time"><Input value={form.time} onChange={(e) => set("time", e.target.value)} placeholder="8:00 PM" /></Field>
            <Field label="Timezone">
              <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Anchorage","UTC"].map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Frequency (MHz) *"><Input type="number" step="0.0001" value={form.frequency} onChange={(e) => set("frequency", e.target.value)} placeholder="462.55" /></Field>
            <Field label="Offset"><Input value={form.offset} onChange={(e) => set("offset", e.target.value)} placeholder="+5.0" /></Field>
            <Field label="Tone"><Input value={form.tone} onChange={(e) => set("tone", e.target.value)} placeholder="141.3" /></Field>
          </div>
          <Field label="Repeater Callsign"><Input value={form.repeater_callsign} onChange={(e) => set("repeater_callsign", e.target.value)} placeholder="K4MIA" /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary Net Control"><Input value={form.primary_net_control} onChange={(e) => set("primary_net_control", e.target.value)} /></Field>
            <Field label="Assistant Net Control"><Input value={form.assistant_net_control} onChange={(e) => set("assistant_net_control", e.target.value)} /></Field>
          </div>
          <Field label="Expected Duration (min)"><Input type="number" value={form.expected_duration_minutes} onChange={(e) => set("expected_duration_minutes", e.target.value)} placeholder="60" /></Field>

          <div className="grid grid-cols-2 gap-2">
            <Toggle label="Auto Start" value={form.auto_start} onChange={(v) => set("auto_start", v)} />
            <Toggle label="Auto End" value={form.auto_end} onChange={(v) => set("auto_end", v)} />
            <Toggle label="Allow Visitors" value={form.allow_visitor_checkins} onChange={(v) => set("allow_visitor_checkins", v)} />
            <Toggle label="Require Callsign" value={form.require_callsign} onChange={(v) => set("require_callsign", v)} />
          </div>
          <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="h-16" placeholder="Internal notes for operators" /></Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name || !form.frequency} className="bg-violet-600 hover:bg-violet-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {editing ? "Save Changes" : "Create Net"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function blank(nc = "") {
  return { name: "", description: "", schedule_type: "recurring", days: [], day_of_week: "", time: "", timezone: "America/New_York", start_date: "", frequency: "", offset: "", tone: "", repeater_callsign: "", primary_net_control: nc, assistant_net_control: "", expected_duration_minutes: "", auto_start: false, auto_end: false, allow_visitor_checkins: true, require_callsign: true, notes: "", category: "general" };
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium ${value ? "bg-violet-500/15 text-violet-200 border-violet-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
      {label}
      <span className={`w-8 h-4 rounded-full relative transition ${value ? "bg-violet-500" : "bg-muted"}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}
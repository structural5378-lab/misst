import React, { useState } from "react";
import { Radio, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { base44 } from "@/api/base44Client";

export default function NetCard({ net, onDeleted }) {
  const { mybbUser } = useMyBBAuth();
  const canControl = mybbUser?.role === "admin" || mybbUser?.role === "moderator";
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.Net.delete(net.id);
    onDeleted?.();
  };
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Radio className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{net.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-primary">{net.schedule}</span>
            <span className="text-xs text-muted-foreground">· {net.time}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-muted-foreground">{net.description}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{net.member_count || 0} Joined</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 items-end">
        <Button
          size="sm"
          className="h-8 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full px-5 text-xs font-semibold"
          onClick={() => {
            const el = document.getElementById(`checkin-${net.id}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          Join
        </Button>
        {canControl && (
          <Link
            to={`/nets/${net.id}/control`}
            className="text-[10px] text-violet-400 hover:text-violet-300 font-medium"
          >
            Net Control →
          </Link>
        )}
        {canControl && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="text-[10px] text-red-400 hover:text-red-300 font-medium flex items-center gap-0.5"
          >
            <Trash2 className="w-2.5 h-2.5" /> Delete
          </button>
        )}
        {canControl && confirming && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
            >
              {deleting ? "..." : "Confirm"}
            </button>
            <span className="text-[10px] text-muted-foreground">/</span>
            <button
              onClick={() => setConfirming(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
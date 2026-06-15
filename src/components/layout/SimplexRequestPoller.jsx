import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { Signal, Check, X } from "lucide-react";

export default function SimplexRequestPoller() {
  const { mybbUser } = useMyBBAuth();
  const navigate = useNavigate();
  const shownRef = useRef(new Set());

  useEffect(() => {
    if (!mybbUser) return;

    const myUID = String(mybbUser.uid || mybbUser.username || "");

    const check = async () => {
      const pending = await base44.entities.LocationShare.filter({ target_uid: myUID, status: "pending" });
      for (const req of pending) {
        if (shownRef.current.has(req.id)) continue;
        shownRef.current.add(req.id);

        const { dismiss } = toast({
          duration: 60000,
          onOpenChange: (open) => { if (!open) dismiss(); },
          title: (
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="font-semibold text-foreground">Simplex Mode Request</span>
            </div>
          ),
          description: (
            <div className="space-y-3 mt-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{req.initiator_username}</span> wants to share locations with you.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    dismiss();
                    await base44.entities.LocationShare.update(req.id, { status: "active" });
                    navigate(`/cineplex?session=${req.id}&role=target`);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  onClick={async () => {
                    dismiss();
                    shownRef.current.delete(req.id);
                    await base44.entities.LocationShare.update(req.id, { status: "declined" });
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground text-xs font-semibold transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Decline
                </button>
              </div>
            </div>
          ),
        });
      }
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [mybbUser]);

  return null;
}
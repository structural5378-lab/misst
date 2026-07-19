import React from "react";
import { ChevronUp, ChevronDown, MessageSquare, ArrowLeft, BookMarked } from "lucide-react";

export default function ThreadNavDock({ onBack, onNewest, onOldest, onReply, hasUnread, onUnread }) {
  const Btn = ({ onClick, icon: Icon, label }) => (
    <button
      onClick={onClick}
      title={label}
      className="w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 active:scale-95 transition-all"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
  return (
    <div className="fixed right-3 z-30 flex flex-col gap-2" style={{ bottom: "calc(8.5rem + env(safe-area-inset-bottom))" }}>
      <Btn onClick={onBack} icon={ArrowLeft} label="Back to category" />
      {hasUnread && <Btn onClick={onUnread} icon={BookMarked} label="Jump to unread" />}
      <Btn onClick={onNewest} icon={ChevronDown} label="Jump to newest" />
      <Btn onClick={onOldest} icon={ChevronUp} label="Jump to oldest" />
      <Btn onClick={onReply} icon={MessageSquare} label="Scroll to reply box" />
    </div>
  );
}
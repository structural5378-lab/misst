import React from "react";
import MistComposer from "@/components/composer/MistComposer";

// Thin wrapper so the thread reply dock uses the unified MIST composer.
export default function QuickReply({ value, onChange, onSend, posting, participants = [], threadId }) {
  return (
    <div className="border-t border-border bg-card/95 backdrop-blur-xl p-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
      <MistComposer
        value={value}
        onChange={onChange}
        onSubmit={onSend}
        submitting={posting}
        participants={participants}
        draftKey={threadId ? `mist_draft_thread_${threadId}` : undefined}
        placeholder="Write a reply... (Markdown supported)"
        submitLabel="Reply"
        autoFocus
      />
    </div>
  );
}
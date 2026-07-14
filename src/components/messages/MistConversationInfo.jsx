import React, { useMemo, useState } from "react";
import {
  Pin, Archive, Bell, BellOff, Ban, Trash2, Users, Image as ImageIcon,
  FileText, Info, ChevronLeft,
} from "lucide-react";

export default function MistConversationInfo({
  conversation, onlineUserIds, onTogglePin, onToggleArchive, onToggleMute,
  onBlock, onLeave, isUserBlocked, onBack,
}) {
  const [tab, setTab] = useState("media");

  const sharedMedia = useMemo(() => {
    // This would need messages passed in; for now show placeholder
    return [];
  }, []);

  if (!conversation) return null;

  const isGroup = conversation.type === "group";
  const otherUser = !isGroup ? conversation.otherParticipants[0] : null;
  const displayName = isGroup ? conversation.title : otherUser?.user_name || "Unknown";
  const displayAvatar = isGroup ? conversation.avatar_url : otherUser?.user_avatar;
  const isOnline = otherUser && onlineUserIds.has(otherUser.user_id);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        {onBack && (
          <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground lg:hidden">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-sm font-bold text-foreground">Conversation Info</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <div className="flex flex-col items-center p-6 border-b border-border">
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayName} className="w-20 h-20 rounded-full object-cover mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold mb-3">
              {isGroup ? <Users className="w-8 h-8" /> : (displayName[0] || "?").toUpperCase()}
            </div>
          )}
          <h3 className="text-base font-bold text-foreground">{displayName}</h3>
          {otherUser?.user_callsign && <p className="text-sm text-primary mt-0.5">{otherUser.user_callsign}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {isGroup ? `${conversation.participants.length} members` : isOnline ? "Online now" : "Offline"}
          </p>
        </div>

        {/* Group members */}
        {isGroup && (
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Members</h4>
            <div className="space-y-2">
              {conversation.participants.map((p) => (
                <div key={p.user_id} className="flex items-center gap-3">
                  <div className="relative">
                    {p.user_avatar ? (
                      <img src={p.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                        {(p.user_name[0] || "?").toUpperCase()}
                      </div>
                    )}
                    {onlineUserIds.has(p.user_id) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />
                    )}
                  </div>
                  <span className="text-sm text-foreground">{p.user_name}</span>
                  {p.role === "admin" && <span className="text-[10px] text-primary font-bold">Admin</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-2">
          <button onClick={() => onTogglePin(conversation.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary text-left">
            <Pin className={`w-4 h-4 ${conversation.isPinned ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm text-foreground">{conversation.isPinned ? "Unpin" : "Pin"} Conversation</span>
          </button>
          <button onClick={() => onToggleMute(conversation.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary text-left">
            {conversation.isMuted ? <BellOff className="w-4 h-4 text-muted-foreground" /> : <Bell className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm text-foreground">{conversation.isMuted ? "Unmute" : "Mute"} Notifications</span>
          </button>
          <button onClick={() => onToggleArchive(conversation.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary text-left">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{conversation.isArchived ? "Unarchive" : "Archive"} Conversation</span>
          </button>
          {!isGroup && otherUser && (
            <button
              onClick={() => isUserBlocked(otherUser.user_id) ? null : onBlock(otherUser.user_id, otherUser.user_name, otherUser.user_avatar)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-left"
            >
              <Ban className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{isUserBlocked(otherUser.user_id) ? "Unblock" : "Block"} User</span>
            </button>
          )}
          <button onClick={() => onLeave(conversation.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-left">
            <Trash2 className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">Delete Conversation</span>
          </button>
        </div>

        {/* Shared media placeholder */}
        <div className="p-4 border-t border-border">
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Shared Media</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square rounded-lg bg-secondary flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div className="aspect-square rounded-lg bg-secondary flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div className="aspect-square rounded-lg bg-secondary flex items-center justify-center">
              <Info className="w-6 h-6 text-muted-foreground/40" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Shared media appears here</p>
        </div>
      </div>
    </div>
  );
}
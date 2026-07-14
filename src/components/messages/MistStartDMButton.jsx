import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

/**
 * MistStartDMButton — Reusable button to start a native MIST direct message.
 * Navigates to /messages with user info as query params; the Messages page
 * creates/finds the conversation and opens it.
 *
 * Usage: <MistStartDMButton userId={u.id} userName={u.full_name} userAvatar={u.avatar_url} userCallsign={u.callsign} />
 */
export default function MistStartDMButton({
  userId, userName, userAvatar, userCallsign,
  label = "Message", icon: Icon = MessageSquare, className = "",
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    const params = new URLSearchParams({
      new_dm: userId,
      name: userName || "",
      avatar: userAvatar || "",
      callsign: userCallsign || "",
    });
    navigate(`/messages?${params.toString()}`);
  };

  return (
    <button onClick={handleClick} className={className}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
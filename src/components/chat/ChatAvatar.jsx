import React, { useState } from "react";

export default function ChatAvatar({ src, name, size = "w-8 h-8", online = false, showStatus = false }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative shrink-0">
      {src && !err ? (
        <img
          src={src}
          alt={name}
          className={`${size} rounded-full object-cover`}
          onError={() => setErr(true)}
        />
      ) : (
        <div className={`${size} rounded-full bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center text-white font-bold text-sm`}>
          {(name || "?").charAt(0).toUpperCase()}
        </div>
      )}
      {showStatus && online && (
        <span className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-400 border-2 border-background ${
          size.includes("w-7") ? "w-2 h-2" : size.includes("w-9") ? "w-2.5 h-2.5" : "w-2 h-2"
        }`} />
      )}
    </div>
  );
}
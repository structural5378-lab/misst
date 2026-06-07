import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function PageHeader({ title, showBack = false, rightAction }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-primary">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
}
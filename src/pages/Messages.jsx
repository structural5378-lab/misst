import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";
import { format } from "date-fns";

export default function Messages() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.DirectMessage.list("-created_date", 50),
    initialData: [],
  });

  return (
    <div>
      <PageHeader title="Messages" />
      <div className="px-4 pt-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9 bg-secondary/50 border-border/50 h-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No Messages</h3>
            <p className="text-xs text-muted-foreground mt-1">Your conversations will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(msg.sender_name || "?")[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{msg.sender_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {msg.created_date && format(new Date(msg.created_date), "MMM d")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.content}</p>
                </div>
                {!msg.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
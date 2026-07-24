import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, Check, ChevronsUpDown } from "lucide-react";

const ROLE_LABEL = {
  community_owner: "Owner",
  community_admin: "Admin",
  moderator: "Moderator",
  trusted_member: "Trusted",
  member: "Member",
  guest: "Guest",
};

export default function CommunitySelector() {
  const navigate = useNavigate();
  const { data: communities = [], isLoading } = useUserCommunities();

  if (isLoading || communities.length === 0) return null;

  const selectedId = localStorage.getItem("selected_community_id");
  const selected = communities.find((c) => c.id === selectedId) || communities[0];

  const handleSelect = (c) => {
    localStorage.setItem("selected_community_id", c.id);
    localStorage.setItem("selected_community_name", c.name);
    // Instant context switch — navigate to the selected community home.
    navigate(`/c/${c.slug}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2 h-8">
          {selected?.logo_url ? (
            <img src={selected.logo_url} alt="" className="w-5 h-5 rounded object-cover" />
          ) : (
            <Users className="w-4 h-4 text-violet-300" />
          )}
          <span className="hidden sm:inline max-w-[120px] truncate font-semibold text-foreground">
            {selected?.name || "Community"}
          </span>
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {communities.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => handleSelect(c)} className="flex items-center gap-2 py-2">
            {c.logo_url ? (
              <img src={c.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
            ) : (
              <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center">
                <Users className="w-3 h-3 text-violet-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{c.name}</div>
              <div className="text-[10px] text-muted-foreground">{ROLE_LABEL[c.role] || c.role}</div>
            </div>
            {c.id === selected?.id && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <div className="my-1 h-px bg-border" />
        <DropdownMenuItem onClick={() => navigate("/community/create")} className="text-primary">
          <Plus className="w-4 h-4 mr-2" /> Create Community
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
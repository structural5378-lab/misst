import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CommunitySelector() {
  const navigate = useNavigate();
  const { mybbUser } = useMistUser();
  const [communities, setCommunities] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunities();
  }, [mybbUser]);

  const loadCommunities = async () => {
    if (!mybbUser) {
      setLoading(false);
      return;
    }

    try {
      // Get user's memberships
      const memberships = await base44.entities.CommunityMember.filter({
        user_id: mybbUser.uid,
        is_active: true,
      });

      const communityIds = memberships.map((m) => m.community_id);
      
      if (communityIds.length === 0) {
        setCommunities([]);
        setLoading(false);
        return;
      }

      // Get community details
      const allCommunities = await base44.entities.Community.filter({
        id: { $in: communityIds },
        is_active: true,
      });

      setCommunities(allCommunities);

      // Get selected from localStorage
      const storedId = localStorage.getItem("selected_community_id");
      const storedName = localStorage.getItem("selected_community_name");
      
      if (storedId && allCommunities.find((c) => c.id === storedId)) {
        setSelectedId(storedId);
        setSelectedName(storedName);
      } else if (allCommunities.length > 0) {
        // Default to first community
        const first = allCommunities[0];
        setSelectedId(first.id);
        setSelectedName(first.name);
        localStorage.setItem("selected_community_id", first.id);
        localStorage.setItem("selected_community_name", first.name);
      }
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (community) => {
    setSelectedId(community.id);
    setSelectedName(community.name);
    localStorage.setItem("selected_community_id", community.id);
    localStorage.setItem("selected_community_name", community.name);
    // Reload page to apply community filter
    window.location.reload();
  };

  if (loading || communities.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-sm">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{selectedName || "Select"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {communities.map((community) => (
          <DropdownMenuItem
            key={community.id}
            onClick={() => handleSelect(community)}
            className="flex items-center gap-2"
          >
            {community.logo_url && (
              <img src={community.logo_url} alt="" className="w-5 h-5 rounded" />
            )}
            <span className="flex-1">{community.name}</span>
            {community.id === selectedId && (
              <span className="text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => navigate("/community/create")}
          className="text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Community
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
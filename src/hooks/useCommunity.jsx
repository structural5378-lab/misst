import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useCommunity() {
  const [communityId, setCommunityId] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cid = localStorage.getItem("selected_community_id");
    const cname = localStorage.getItem("selected_community_name");
    
    if (!cid) {
      setLoading(false);
      return;
    }

    setCommunityId(cid);
    setCommunityName(cname || "");

    // Fetch community details
    base44.entities.Community.get(cid)
      .then((c) => {
        setCommunity(c);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { communityId, communityName, community, loading };
}
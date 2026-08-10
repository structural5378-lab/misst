import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { mist } from '@/api/mist';
import { ChevronRight, Building, ExternalLink, Megaphone, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CommunityOverviewTab from "@/components/platform/communityMgmt/CommunityOverviewTab";
import CommunityMembersTab from "@/components/platform/communityMgmt/CommunityMembersTab";
import CommunitySettingsTab from "@/components/platform/communityMgmt/CommunitySettingsTab";
import CommunityContentTab from "@/components/platform/communityMgmt/CommunityContentTab";
import CommunityReportsTab from "@/components/platform/communityMgmt/CommunityReportsTab";
import CommunityAnalyticsTab from "@/components/platform/communityMgmt/CommunityAnalyticsTab";
import CommunityAdminTab from "@/components/platform/communityMgmt/CommunityAdminTab";
import CommunityAuditTab from "@/components/platform/communityMgmt/CommunityAuditTab";
import AnnouncementDialog from "@/components/platform/communityMgmt/AnnouncementDialog";

function StatusBadge({ status }) {
  const map = {
    active: "bg-success/15 text-success",
    suspended: "bg-warning/15 text-warning",
    archived: "bg-muted text-muted-foreground",
    pending: "bg-info/15 text-info",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] || map.active}`}>{status || "active"}</span>;
}

export default function PlatformAdminCommunityDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [announceOpen, setAnnounceOpen] = useState(false);

  const { data: community, isLoading } = useQuery({
    queryKey: ["admin-community-detail", "community", id],
    queryFn: async () => await mist.entities.Community.get(id),
    enabled: !!id,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["admin-community-detail", "members", id],
    queryFn: async () => (await mist.entities.CommunityMember.filter({ community_id: id }, "-joined_date", 5000)) || [],
    enabled: !!id,
  });
  const { data: audit = [] } = useQuery({
    queryKey: ["admin-community-detail", "audit", id],
    queryFn: async () => {
      const res = await mist.functions.invoke("adminManageCommunity", { action: "audit_list", community_id: id });
      return res.data?.logs || [];
    },
    enabled: !!id,
  });

  const onChanged = () => qc.invalidateQueries(["admin-community-detail"]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!community) {
    return <div className="py-20 text-center text-muted-foreground">Community not found.</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
        <Link to="/platform/admin" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/platform/admin/communities" className="hover:text-foreground">Community Management</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate">{community.name}</span>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {community.logo_url
              ? <img src={community.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
              : <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center"><Building className="w-6 h-6 text-primary" /></div>}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{community.name}</h1>
              <p className="text-xs text-muted-foreground truncate">{community.slug} · Owner: {community.owner_name || "—"}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={community.status || "active"} />
                <span className="text-xs text-muted-foreground">{community.visibility === "public" ? "Public" : "Private"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
            <Link to={`/c/${community.slug}`} target="_blank"><Button variant="outline" size="sm"><ExternalLink className="w-4 h-4" />Open</Button></Link>
            <Button variant="outline" size="sm" onClick={() => setTab("settings")}>Edit</Button>
            <Button variant="outline" size="sm" onClick={() => setAnnounceOpen(true)}><Megaphone className="w-4 h-4" />Announce</Button>
            {community.status === "suspended"
              ? <Button variant="outline" size="sm" className="text-success" onClick={() => setTab("admin")}><PlayCircle className="w-4 h-4" />Reactivate</Button>
              : <Button variant="outline" size="sm" className="text-warning" onClick={() => setTab("admin")}><PauseCircle className="w-4 h-4" />Suspend</Button>}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="moderators">Moderators</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><CommunityOverviewTab community={community} members={members} /></TabsContent>
        <TabsContent value="members"><CommunityMembersTab community={community} members={members} onChanged={onChanged} /></TabsContent>
        <TabsContent value="moderators"><CommunityMembersTab community={community} members={members} onChanged={onChanged} moderatorsOnly /></TabsContent>
        <TabsContent value="settings"><CommunitySettingsTab community={community} onChanged={onChanged} /></TabsContent>
        <TabsContent value="content"><CommunityContentTab community={community} onChanged={onChanged} /></TabsContent>
        <TabsContent value="reports"><CommunityReportsTab community={community} /></TabsContent>
        <TabsContent value="analytics"><CommunityAnalyticsTab community={community} members={members} /></TabsContent>
        <TabsContent value="audit"><CommunityAuditTab audit={audit} /></TabsContent>
        <TabsContent value="admin"><CommunityAdminTab community={community} audit={audit} onChanged={onChanged} /></TabsContent>
      </Tabs>

      <AnnouncementDialog open={announceOpen} onOpenChange={setAnnounceOpen} community={community} />
    </div>
  );
}
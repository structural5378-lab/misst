import React, { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, X, RefreshCw, Megaphone, Pin, Flame, Star, Inbox,
  MessageSquare, ChevronLeft,
} from "lucide-react";
import QuickActions from "@/components/community/QuickActions";
import CategoryCard from "@/components/community/CategoryCard";
import ThreadCard from "@/components/community/ThreadCard";
import MemberStats from "@/components/community/MemberStats";
import { useAuth } from "@/lib/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const TABS = [
  { id: "recent", label: "Recent", icon: MessageSquare },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "unread", label: "Unread", icon: Inbox },
  { id: "featured", label: "Featured", icon: Star },
];

export default function Community() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: () => base44.entities.ForumCategory.list("sort_order", 50),
    staleTime: 60000,
  });

  const { data: threads = [], isLoading: threadsLoading, refetch } = useQuery({
    queryKey: ["forum-threads"],
    queryFn: () => base44.entities.ForumThread.filter({}, "-last_reply_date", 100),
    staleTime: 30000,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["forum-subs", user?.id],
    queryFn: () => base44.entities.ForumSubscription.filter({ user_id: user.id }, "-created_date", 200),
    enabled: !!user?.id,
    staleTime: 15000,
  });

  const { data: memberCount = 0 } = useQuery({
    queryKey: ["forum-member-count"],
    queryFn: async () => {
      const users = await base44.entities.UserStats.list("-created_date", 1);
      return users.length > 0 ? 100 : 0; // placeholder; real count from admin stats
    },
    staleTime: 300000,
  });

  const subByThread = useMemo(() => {
    const map = {};
    subscriptions.forEach(s => { map[s.thread_id] = s; });
    return map;
  }, [subscriptions]);

  const activeThreads = threads.filter(t => !t.is_deleted);

  const pinnedAnnouncements = activeThreads.filter(t => t.is_announcement);
  const featuredThreads = activeThreads.filter(t => t.is_featured);

  const filteredThreads = useMemo(() => {
    let list = activeThreads;
    if (selectedCategory) {
      list = list.filter(t => t.category_id === selectedCategory.id);
    }
    if (filter === "mine") {
      list = list.filter(t => t.author_id === user?.id);
    } else if (filter === "bookmarks") {
      const bookmarked = subscriptions.filter(s => s.is_bookmarked).map(s => s.thread_id);
      list = list.filter(t => bookmarked.includes(t.id));
    } else if (filter === "subscribed") {
      const subbed = subscriptions.filter(s => s.is_subscribed).map(s => s.thread_id);
      list = list.filter(t => subbed.includes(t.id));
    } else if (filter === "moderation" && isAdmin) {
      list = list.filter(t => t.is_locked || t.is_pinned || t.reply_count > 50);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.title?.toLowerCase().includes(q) || t.body?.toLowerCase().includes(q));
    }
    if (activeTab === "trending") {
      list = [...list].sort((a, b) => (b.reply_count || 0) * 3 + (b.view_count || 0) - ((a.reply_count || 0) * 3 + (a.view_count || 0)));
    } else if (activeTab === "unread") {
      list = list.filter(t => subByThread[t.id]?.unread_count > 0 || (!subByThread[t.id] && t.last_reply_date && user?.id && t.author_id !== user.id));
    } else if (activeTab === "featured") {
      list = list.filter(t => t.is_featured);
    }
    const pinned = list.filter(t => t.is_pinned);
    const rest = list.filter(t => !t.is_pinned);
    return [...pinned, ...rest];
  }, [activeThreads, selectedCategory, filter, searchQuery, activeTab, subByThread, user, subscriptions, isAdmin]);

  const totalPosts = activeThreads.reduce((sum, t) => sum + (t.reply_count || 0), 0);
  const unreadCount = subscriptions.reduce((sum, s) => sum + (s.unread_count || 0), 0);

  const handleCategoryClick = (catId, catName) => {
    const cat = categories.find(c => c.id === catId);
    if (cat) { setSelectedCategory(cat); setActiveTab("recent"); }
  };

  const clearFilter = () => {
    setSearchParams({});
    setSelectedCategory(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          {selectedCategory ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button onClick={() => setSelectedCategory(null)} className="text-primary p-1 -ml-1 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-bold text-foreground truncate">{selectedCategory.name}</h1>
            </div>
          ) : filter ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button onClick={clearFilter} className="text-primary p-1 -ml-1 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-bold text-foreground truncate capitalize">{filter}</h1>
            </div>
          ) : (
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              Community
              {unreadCount > 0 && (
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h1>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-muted-foreground hover:text-foreground">
              {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            <button onClick={() => refetch()} className="p-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className={`w-4 h-4 ${threadsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {showSearch && (
          <div className="flex items-center gap-2 px-4 pb-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              autoFocus
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-1 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions onSearch={() => setShowSearch(true)} isAdmin={isAdmin} />

      {/* Pinned Announcements */}
      {!selectedCategory && !filter && pinnedAnnouncements.length > 0 && (
        <div className="px-4 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-1.5 px-1">
            <Megaphone className="w-3.5 h-3.5" /> Announcements
          </div>
          <div className="space-y-1.5">
            {pinnedAnnouncements.slice(0, 3).map((t) => (
              <div key={t.id} className="rounded-xl border border-rose-500/20 bg-rose-500/5 overflow-hidden">
                <ThreadCard thread={t} onCategoryClick={handleCategoryClick} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid (only on home, no filter/category selected) */}
      {!selectedCategory && !filter && (
        <div className="pt-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1 px-4">
            <Pin className="w-3.5 h-3.5" /> Categories
          </div>
          {catLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No categories yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} onClick={() => { setSelectedCategory(cat); setActiveTab("recent"); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {!filter && (
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b border-border mt-3">
          <div className="flex px-4 gap-1 py-2 overflow-x-auto scrollbar-hide">
            {TABS.map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {label}
                {id === "unread" && unreadCount > 0 && (
                  <span className="text-[9px] bg-primary text-primary-foreground px-1 rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thread List */}
      <div className="pt-1">
        {threadsLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No discussions found" : activeTab === "unread" ? "All caught up!" : "No discussions yet"}
            </p>
            {!searchQuery && activeTab === "recent" && (
              <button onClick={() => navigate("/community/new")} className="mt-3 text-xs text-primary hover:underline">
                Start the first discussion
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredThreads.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                unread={subByThread[t.id]?.unread_count > 0}
                onCategoryClick={handleCategoryClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Member Stats */}
      {!selectedCategory && !filter && (
        <div className="pt-4">
          <MemberStats threads={activeThreads.length} posts={totalPosts} members={memberCount} categories={categories.length} />
        </div>
      )}
    </div>
  );
}
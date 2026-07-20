import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { Link } from "react-router-dom";
import { SectionCard } from "../ui";
import { Users, MessageSquare, Reply, Heart, Trophy, Bookmark, UserCheck, Activity } from "lucide-react";

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground"><Icon className="w-3.5 h-3.5" /><span className="text-[10px] uppercase tracking-wide">{label}</span></div>
      <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
    </div>
  );
}

export default function AccountCommunity() {
  const { user } = useMistUser();
  const uid = user?.id;

  const { data: threads = [] } = useQuery({
    queryKey: ["account-threads", uid], queryFn: () => base44.entities.ForumThread.filter({ author_id: uid }, "-created_date", 50), enabled: !!uid, staleTime: 30000,
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["account-posts", uid], queryFn: () => base44.entities.ForumPost.filter({ author_id: uid }, "-created_date", 50), enabled: !!uid, staleTime: 30000,
  });
  const { data: stats = {} } = useQuery({
    queryKey: ["mist-user-stats", uid], queryFn: async () => (await base44.entities.UserStats.filter({ user_id: uid }))?.[0] || {}, enabled: !!uid, staleTime: 30000,
  });
  const { data: subs = [] } = useQuery({
    queryKey: ["account-subs", uid], queryFn: () => base44.entities.ForumSubscription.filter({ user_id: uid }, "-created_date", 100), enabled: !!uid, staleTime: 30000,
  });

  const likes = [...threads, ...posts].reduce((s, p) => {
    try { const r = JSON.parse(p.reactions || p.reaction_counts || "{}"); return s + Object.values(r).reduce((a, b) => a + (typeof b === "number" ? b : Array.isArray(b) ? b.length : 0), 0); }
    catch { return s; }
  }, 0);
  const bookmarks = subs.filter((s) => s.is_bookmarked).length;

  const activity = [
    ...threads.map((t) => ({ id: t.id, type: "thread", title: t.title, date: t.created_date })),
    ...posts.map((p) => ({ id: p.id, type: "reply", title: p.thread_title, date: p.created_date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return (
    <div className="space-y-4">
      <SectionCard title="Community Stats" desc="Your activity across MIST." icon={Users}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox icon={MessageSquare} label="Threads" value={threads.length} />
          <StatBox icon={Reply} label="Replies" value={posts.length} />
          <StatBox icon={Heart} label="Likes Received" value={likes} />
          <StatBox icon={Trophy} label="Reputation" value={stats.reputation ?? 0} />
          <StatBox icon={Trophy} label="Achievements" value={stats.achievements_count ?? 0} />
          <StatBox icon={Bookmark} label="Bookmarks" value={bookmarks} />
          <StatBox icon={UserCheck} label="Following" value={stats.friends ?? 0} />
          <StatBox icon={UserCheck} label="Followers" value={stats.friends ?? 0} />
        </div>
      </SectionCard>

      <SectionCard title="Recent Activity" desc="Your latest contributions." icon={Activity}>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity. Join a discussion to get started!</p>
        ) : (
          <div className="space-y-1.5">
            {activity.map((a) => (
              <Link key={a.type + a.id} to={`/community/thread/${a.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary/40">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-primary">{a.type === "thread" ? "Thread" : "Reply"}</span>
                  <p className="text-sm text-foreground truncate">{a.title || "Untitled"}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{a.date ? new Date(a.date).toLocaleDateString() : ""}</span>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Badges" desc={`${stats.achievements_count ?? 0} earned`} icon={Trophy}>
        <p className="text-sm text-muted-foreground">View your full badge collection on the <Link to="/achievements" className="text-primary hover:underline">Achievements</Link> page.</p>
      </SectionCard>
    </div>
  );
}
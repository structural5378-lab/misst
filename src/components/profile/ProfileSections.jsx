import React from "react";
import { Link } from "react-router-dom";
import { Radio, Users, Star, Bookmark, MessageSquare, Hash, Trophy } from "lucide-react";
import LevelBar from "@/components/achievements/LevelBar";
import PrestigeStats from "@/components/profile/PrestigeStats";
import { timeAgo } from "@/lib/forumUtils";

export function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border/60">
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function ProfileStats({ stats }) {
  return (
    <div className="space-y-3">
      <LevelBar xp={stats.xp || 0} />
      <PrestigeStats stats={stats} />
    </div>
  );
}

export function ProfileEquipment({ radios }) {
  if (!radios || radios.length === 0) return <p className="text-sm text-muted-foreground">No equipment listed.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {radios.map((r, i) => (
        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg flex items-center gap-1">
          <Radio className="w-3 h-3" />{r}
        </span>
      ))}
    </div>
  );
}

export function ProfileClubs({ clubs, favoriteRepeater }) {
  return (
    <div className="space-y-2">
      {favoriteRepeater && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400" />Favorite: {favoriteRepeater}
        </p>
      )}
      {clubs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No club memberships.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {clubs.map((c) => (
            <Link key={c.id} to={`/c/${c.community_slug}`} className="text-xs bg-secondary px-2 py-1 rounded-lg flex items-center gap-1 text-foreground hover:border-primary/40 border border-border/50">
              <Users className="w-3 h-3 text-primary" />{c.community_name || "Club"}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfileRecentThreads({ threads }) {
  if (!threads.length) return <p className="text-sm text-muted-foreground">No threads yet.</p>;
  return (
    <div className="space-y-2">
      {threads.slice(0, 5).map((t) => (
        <Link key={t.id} to={`/community/thread/${t.id}`} className="block text-sm text-foreground hover:text-primary truncate">{t.title}</Link>
      ))}
    </div>
  );
}

export function ProfileRecentReplies({ posts }) {
  if (!posts.length) return <p className="text-sm text-muted-foreground">No replies yet.</p>;
  return (
    <div className="space-y-2">
      {posts.slice(0, 5).map((p) => (
        <Link key={p.id} to={`/community/thread/${p.thread_id}`} className="block text-xs text-muted-foreground hover:text-primary line-clamp-1">{(p.body || "").slice(0, 80)}</Link>
      ))}
    </div>
  );
}

export function ProfileBookmarks({ bookmarks }) {
  if (!bookmarks.length) return <p className="text-sm text-muted-foreground">No bookmarks.</p>;
  return (
    <div className="space-y-2">
      {bookmarks.slice(0, 5).map((s) => (
        <Link key={s.id} to={`/community/thread/${s.thread_id}`} className="block text-sm text-foreground hover:text-primary truncate flex items-center gap-1">
          <Bookmark className="w-3 h-3 text-amber-400 shrink-0" />{s.thread_title}
        </Link>
      ))}
    </div>
  );
}

export function ProfileMediaGallery({ threads, posts }) {
  const imgs = [
    ...threads.filter((t) => t.image_url).map((t) => t.image_url),
    ...posts.filter((p) => p.image_url).map((p) => p.image_url),
  ].slice(0, 9);
  if (!imgs.length) return <p className="text-sm text-muted-foreground">No media yet.</p>;
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {imgs.map((url, i) => <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />)}
    </div>
  );
}

export function ProfileTimeline({ threads, posts, achievements }) {
  const items = [
    ...threads.map((t) => ({ type: "thread", time: t.created_date, title: t.title, id: t.id, icon: Hash })),
    ...posts.map((p) => ({ type: "reply", time: p.created_date, title: (p.body || "").slice(0, 60), id: p.thread_id, icon: MessageSquare })),
    ...achievements.map((a) => ({ type: "award", time: a.unlocked_date, title: a.achievement_name || a.achievement_id, id: a.id, icon: Trophy })),
  ].filter((i) => i.time).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12);
  if (!items.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <Link key={i} to={it.type === "award" ? "/achievements" : `/community/thread/${it.id}`} className="flex items-center gap-2 text-xs">
          <it.icon className="w-3 h-3 text-primary shrink-0" />
          <span className="text-foreground truncate flex-1">{it.title}</span>
          <span className="text-muted-foreground/60 shrink-0">{timeAgo(it.time)}</span>
        </Link>
      ))}
    </div>
  );
}
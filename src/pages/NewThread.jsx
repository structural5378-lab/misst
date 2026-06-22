import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import { Loader2, AlertCircle } from "lucide-react";

export default function NewThread() {
  const navigate = useNavigate();
  const { mybbUser } = useMyBBAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCategory = urlParams.get("category") || "";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [forumId, setForumId] = useState(preselectedCategory);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // Load forums from MyBB (real forums with fid)
  const { data: forums = [] } = useQuery({
    queryKey: ["mybb-forums-list"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "forums" });
      const list = res.data?.forums || [];
      // Only show forums that can have threads (not categories — type !== 'c')
      return list
        .filter(f => f.type !== "c")
        .sort((a, b) => parseInt(a.disporder || 0) - parseInt(b.disporder || 0));
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !forumId || !mybbUser) return;
    setPosting(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("fetchMyBBForums", {
        action: "create_thread",
        fid: forumId,
        subject: title.trim(),
        message: body.trim() || title.trim(),
      });
      if (res.data?.error) {
        setError(res.data.error);
      } else if (res.data?.tid) {
        navigate(`/community-forum`);
      } else {
        setError("Thread posted but no ID returned. Check the forum.");
        navigate(`/community-forum`);
      }
    } catch (err) {
      setError(err.message || "Failed to post thread.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="New Thread" showBack />
      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">

        {!mybbUser && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            You must be logged in to post.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label>Forum</Label>
          <Select value={forumId} onValueChange={setForumId}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select forum" />
            </SelectTrigger>
            <SelectContent>
              {forums.map((f) => (
                <SelectItem key={f.fid} value={String(f.fid)}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Thread title"
            className="bg-secondary/50"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your post..."
            className="bg-secondary/50 min-h-[200px]"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-primary hover:bg-primary/90"
          disabled={posting || !title.trim() || !forumId}
        >
          {posting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting to Forum...</>
          ) : "Post Thread"}
        </Button>
      </form>
    </div>
  );
}
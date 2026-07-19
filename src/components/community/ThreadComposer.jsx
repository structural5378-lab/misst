import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MistComposer from "@/components/composer/MistComposer";

export default function ThreadComposer({ categories, user, onSubmitted, onCancel, defaultCategory }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategory || "");
  const [tags, setTags] = useState([]);
  const [poll, setPoll] = useState({ question: "", options: ["", ""] });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !categoryId || !body.trim()) return;
    setPosting(true);
    setError("");
    try {
      const cat = categories.find((c) => c.id === categoryId);
      const imgMatch = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
      const validPoll = poll.question.trim() && poll.options.filter((o) => o.trim()).length >= 2;
      await base44.entities.ForumThread.create({
        title: title.trim(),
        body,
        category_id: categoryId,
        category_name: cat?.name || "",
        community_id: cat?.community_id || "",
        author_id: user.id,
        author_name: user.full_name || "Anonymous",
        author_callsign: user.callsign || "",
        author_avatar: user.avatar_url || "",
        tags: JSON.stringify(tags),
        image_url: imgMatch ? imgMatch[1] : "",
        has_poll: !!validPoll,
        poll_data: validPoll ? JSON.stringify({ question: poll.question, options: poll.options.filter((o) => o.trim()) }) : "",
        reply_count: 0,
        view_count: 0,
        last_reply_date: new Date().toISOString(),
        last_reply_author: user.full_name || "Anonymous",
        last_reply_author_id: user.id,
        last_reply_avatar: user.avatar_url || "",
      });
      localStorage.removeItem("mist_draft_newthread");
      onSubmitted();
    } catch (err) {
      setError(err.message || "Failed to create thread");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title" className="bg-secondary/50" />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <MistComposer
          value={body}
          onChange={setBody}
          tags={tags}
          onTagsChange={setTags}
          allowPoll
          poll={poll}
          onPollChange={setPoll}
          draftKey="mist_draft_newthread"
          placeholder="Write your post... (Markdown supported)"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pb-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={posting || !title.trim() || !categoryId || !body.trim()} className="gap-2">
          {posting ? "Posting..." : "Post Thread"}
        </Button>
      </div>
    </div>
  );
}
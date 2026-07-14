import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ImagePlus, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

export default function ThreadComposer({ categories, user, onSubmitted, onCancel, defaultCategory }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategory || "");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(res.file_url);
    } catch {
      setError("Failed to upload image");
    }
  };

  const stripHtml = (html) => html.replace(/<[^>]*>/g, "").trim();

  const handleSubmit = async () => {
    if (!title.trim() || !categoryId || !stripHtml(body)) return;
    setPosting(true);
    setError("");
    try {
      const cat = categories.find(c => c.id === categoryId);
      const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      await base44.entities.ForumThread.create({
        title: title.trim(),
        body,
        category_id: categoryId,
        category_name: cat?.name || "",
        author_id: user.id,
        author_name: user.full_name || "Anonymous",
        author_callsign: user.callsign || "",
        author_avatar: user.avatar_url || "",
        tags: JSON.stringify(tagArray),
        image_url: imageUrl,
        reply_count: 0,
        view_count: 0,
        last_reply_date: new Date().toISOString(),
        last_reply_author: user.full_name || "Anonymous",
        last_reply_author_id: user.id,
        last_reply_avatar: user.avatar_url || "",
      });
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
        <Label>Tags (comma-separated)</Label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="help, antenna, gmrs" className="bg-secondary/50" />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <div className="rounded-lg overflow-hidden border border-border/50 bg-background">
          <ReactQuill
            theme="snow"
            value={body}
            onChange={setBody}
            modules={QUILL_MODULES}
            placeholder="Write your post..."
            className="community-quill"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Image (optional)</Label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors text-sm">
            <ImagePlus className="w-4 h-4" />
            {imageFile ? imageFile.name : "Upload image"}
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <button onClick={() => { setImageUrl(""); setImageFile(null); }} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-destructive-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pb-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={posting || !title.trim() || !categoryId || !stripHtml(body)} className="gap-2">
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {posting ? "Posting..." : "Post Thread"}
        </Button>
      </div>
    </div>
  );
}
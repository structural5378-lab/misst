import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import { Loader2 } from "lucide-react";

export default function NewThread() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCategory = urlParams.get("category") || "";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState(preselectedCategory);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: categories } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: () => base44.entities.ForumCategory.list("sort_order", 50),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ForumThread.create(data),
    onSuccess: (result) => {
      navigate(`/forums/thread/${result.id}`);
    },
  });

  const selectedCat = categories.find((c) => c.id === categoryId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    createMutation.mutate({
      title,
      body,
      category_id: categoryId,
      category_name: selectedCat?.name || "",
      author_name: user?.full_name || "Anonymous",
      author_callsign: user?.callsign || "",
      reply_count: 0,
    });
  };

  return (
    <div>
      <PageHeader title="New Thread" showBack />
      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
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
          disabled={createMutation.isPending || !title.trim() || !categoryId}
        >
          {createMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</>
          ) : "Post Thread"}
        </Button>
      </form>
    </div>
  );
}
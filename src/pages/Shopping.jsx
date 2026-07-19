import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { ShoppingBag, Plus, ExternalLink, DollarSign, Tag, User, Filter, Search, ShoppingCart, TrendingUp, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/layout/PageHeader";

const categoryIcons = {
  electronics: "💻",
  radio_gear: "📻",
  accessories: "🔌",
  clothing: "👕",
  home: "🏠",
  other: "📦",
};

const conditionColors = {
  new: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  like_new: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  good: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fair: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  for_parts: "bg-red-500/20 text-red-400 border-red-500/30",
};

const sourceBadges = {
  amazon: "bg-orange-500/20 text-orange-400",
  ebay: "bg-blue-500/20 text-blue-400",
  community: "bg-violet-500/20 text-violet-400",
  other: "bg-gray-500/20 text-gray-400",
};

export default function Shopping() {
  const { mybbUser } = useMistUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["marketplaceItems"],
    queryFn: () => base44.entities.MarketplaceItem.list("-posted_date", 50),
  });

  const addMutation = useMutation({
    mutationFn: async (newItem) => {
      return base44.entities.MarketplaceItem.create({
        ...newItem,
        posted_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["marketplaceItems"]);
      setShowAddDialog(false);
    },
  });

  const filteredItems = items?.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory && item.is_available;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const imageFile = formData.get("image");
    
    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      setUploading(true);
      try {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = uploadRes.file_url;
      } catch (err) {
        console.error("Upload failed:", err);
      }
      setUploading(false);
    }

    addMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      price: parseFloat(formData.get("price")),
      source: formData.get("source"),
      source_url: formData.get("source_url"),
      category: formData.get("category"),
      condition: formData.get("condition"),
      seller_name: mybbUser?.username || "Anonymous",
      seller_id: mybbUser?.uid || "",
      image_url: imageUrl,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Community Marketplace" showBack />
      
      <div className="p-4 space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <ShoppingCart className="w-5 h-5 text-violet-400 mb-1" />
            <span className="text-lg font-bold text-foreground">{items?.length || 0}</span>
            <span className="text-[10px] text-muted-foreground">Active Listings</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-lg font-bold text-foreground">
              {items?.filter(i => i.source === "community").length || 0}
            </span>
            <span className="text-[10px] text-muted-foreground">Community</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <Clock className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-lg font-bold text-foreground">
              {items?.filter(i => Date.now() - new Date(i.posted_date).getTime() < 86400000).length || 0}
            </span>
            <span className="text-[10px] text-muted-foreground">New Today</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[110px] h-11">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="radio_gear">Radio Gear</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Item Button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
              <Plus className="w-5 h-5 mr-2" />
              List Item for Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>List Item for Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Item Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Baofeng UV-5R Radio"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the item, condition, features..."
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select name="condition" defaultValue="good">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="for_parts">For Parts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="other">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="radio_gear">Radio Gear</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select name="source" defaultValue="community">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="ebay">eBay</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source_url">Purchase Link (optional)</Label>
                <Input
                  id="source_url"
                  name="source_url"
                  type="url"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Item Photo (optional)</Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                />
              </div>
              <Button type="submit" className="w-full" disabled={uploading || addMutation.isPending}>
                {uploading ? "Uploading..." : addMutation.isPending ? "Listing..." : "List Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Items Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading items...</div>
        ) : filteredItems?.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No items found</h3>
            <p className="text-sm text-muted-foreground">Be the first to list something!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems?.map((item) => (
              <div
                key={item.id}
                className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden hover:border-violet-500/30 transition-all"
              >
                {item.image_url ? (
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className={`absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-violet-950/80 to-purple-950/80`}>
                      <span className="text-4xl">{categoryIcons[item.category] || "📦"}</span>
                    </div>
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-semibold ${sourceBadges[item.source]}`}>
                      {item.source.charAt(0).toUpperCase() + item.source.slice(1)}
                    </div>
                  </div>
                ) : (
                  <div className={`aspect-video bg-gradient-to-br from-violet-950/80 to-purple-950/80 flex items-center justify-center relative`}>
                    <span className="text-4xl">{categoryIcons[item.category] || "📦"}</span>
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-semibold ${sourceBadges[item.source]}`}>
                      {item.source.charAt(0).toUpperCase() + item.source.slice(1)}
                    </div>
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-1">{item.title}</h3>
                    <span className="text-base font-bold text-emerald-400 whitespace-nowrap">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${conditionColors[item.condition]}`}>
                        {item.condition.replace("_", " ").toUpperCase()}
                      </span>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        >
                          Buy <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {item.views || 0}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.07]">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.seller_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
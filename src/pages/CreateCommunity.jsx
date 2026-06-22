import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { base44 as base44Client } from "@/api/base44Client";

export default function CreateCommunity() {
  const navigate = useNavigate();
  const { mybbUser } = useMyBBAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    callsign: "",
    description: "",
    primary_color: "#8B5CF6",
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await base44Client.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, logo_url: response.file_url }));
    } catch (err) {
      setError("Failed to upload logo");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mybbUser) {
      setError("You must be logged in to create a community");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const community = await base44.entities.Community.create({
        ...formData,
        founder_uid: mybbUser.uid,
        founder_name: mybbUser.username,
        created_date: new Date().toISOString(),
        member_count: 1,
        is_active: true,
      });

      // Add founder as first member
      await base44.entities.CommunityMember.create({
        user_id: mybbUser.uid,
        user_name: mybbUser.username,
        user_callsign: mybbUser.callsign || "",
        user_avatar: mybbUser.avatar_url || "",
        community_id: community.id,
        community_name: formData.name,
        role: "admin",
        joined_date: new Date().toISOString(),
        is_active: true,
      });

      // Set as current community
      localStorage.setItem("selected_community_id", community.id);
      localStorage.setItem("selected_community_name", formData.name);

      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Community</CardTitle>
            <CardDescription>Set up a new GMRS club space</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Community Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. MIST Insomniacs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="callsign">Club Callsign</Label>
                <Input
                  id="callsign"
                  value={formData.callsign}
                  onChange={(e) => setFormData({ ...formData, callsign: e.target.value.toUpperCase() })}
                  placeholder="e.g. MIST, K4NET"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your club"
                />
              </div>

              <div>
                <Label htmlFor="logo">Club Logo (optional)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Logo" className="w-10 h-10 rounded" />
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-10 h-10 rounded border-0"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Community"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
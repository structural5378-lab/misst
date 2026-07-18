import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, ImageOff } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function PlatformAdminGallery() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => await base44.entities.GatheringPhoto.list(200),
    refetchInterval: 60000,
  });
  const rows = data || [];

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await base44.entities.GatheringPhoto.delete(toDelete.id);
      toast({ title: "Photo deleted" });
      qc.invalidateQueries(["admin-gallery"]);
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const bulkDelete = async (selected) => {
    if (!selected.length) return;
    for (const r of selected) {
      try { await base44.entities.GatheringPhoto.delete(r.id); } catch (e) { /* ignore */ }
    }
    toast({ title: `${selected.length} photo(s) deleted` });
    qc.invalidateQueries(["admin-gallery"]);
  };

  const columns = [
    { key: "image_url", header: "Photo", render: (r) => r.image_url ? <img src={r.image_url} alt="" className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><ImageOff className="w-4 h-4 text-muted-foreground" /></div> },
    { key: "title", header: "Title", sortable: true, render: (r) => r.title || "Untitled" },
    { key: "community_name", header: "Community", sortable: true, render: (r) => r.community_name || "—" },
    { key: "author_name", header: "Uploader", render: (r) => r.author_name || r.uploaded_by || "—" },
    { key: "created_date", header: "Date", sortable: true, render: (r) => r.created_date ? new Date(r.created_date).toLocaleDateString() : "—" },
    { key: "actions", header: "Actions", render: (r) => (
      <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setToDelete(r)}><Trash2 className="w-3.5 h-3.5" /></Button>
    ) },
  ];

  return (
    <AdminSection title="Gallery Management" description="Moderate community gathering photos across all communities.">
      <AdminDataTable columns={columns} rows={rows} searchKeys={["title", "community_name", "author_name"]} bulkActions={[{ label: "Delete Selected", variant: "destructive", onClick: bulkDelete }]} exportFilename="gallery" />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this photo?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. The photo will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSection>
  );
}
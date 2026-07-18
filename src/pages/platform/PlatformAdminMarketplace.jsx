import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, EyeOff, CheckCircle2 } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import AdminDataTable from "@/components/platform/AdminDataTable";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function PlatformAdminMarketplace() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-marketplace"],
    queryFn: async () => await base44.entities.MarketplaceItem.list(200),
    refetchInterval: 60000,
  });
  const rows = data || [];

  const toggleAvail = async (r) => {
    try {
      await base44.entities.MarketplaceItem.update(r.id, { is_available: !r.is_available });
      toast({ title: r.is_available ? "Listing disabled" : "Listing enabled" });
      qc.invalidateQueries(["admin-marketplace"]);
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await base44.entities.MarketplaceItem.delete(toDelete.id);
      toast({ title: "Listing deleted" });
      qc.invalidateQueries(["admin-marketplace"]);
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
      try { await base44.entities.MarketplaceItem.delete(r.id); } catch (e) { /* ignore */ }
    }
    toast({ title: `${selected.length} listing(s) deleted` });
    qc.invalidateQueries(["admin-marketplace"]);
  };

  const columns = [
    { key: "image_url", header: "Image", render: (r) => r.image_url ? <img src={r.image_url} alt="" className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted" /> },
    { key: "title", header: "Title", sortable: true, render: (r) => r.title },
    { key: "price", header: "Price", sortable: true, render: (r) => `$${(r.price ?? 0).toFixed(2)}` },
    { key: "seller_name", header: "Seller", sortable: true },
    { key: "community_name", header: "Community", sortable: true, render: (r) => r.community_name || "—" },
    { key: "condition", header: "Condition", sortable: true, render: (r) => r.condition || "—" },
    { key: "is_available", header: "Status", sortable: true, render: (r) => r.is_available ? <span className="text-emerald-400 text-xs font-medium">Active</span> : <span className="text-muted-foreground text-xs">Disabled</span> },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" className="h-7" onClick={() => toggleAvail(r)}>{r.is_available ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}</Button>
        <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setToDelete(r)}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    ) },
  ];

  return (
    <AdminSection title="Marketplace Management" description="Moderate community marketplace listings across the platform.">
      <AdminDataTable columns={columns} rows={rows} searchKeys={["title", "seller_name", "community_name"]} bulkActions={[{ label: "Delete Selected", variant: "destructive", onClick: bulkDelete }]} exportFilename="marketplace" />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this listing?</AlertDialogTitle><AlertDialogDescription>The marketplace item will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSection>
  );
}
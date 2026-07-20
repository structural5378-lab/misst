import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useMistUser } from "@/hooks/useMistUser";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { SectionCard } from "../ui";
import AvatarUploader from "../AvatarUploader";
import BannerUploader from "../BannerUploader";
import { Image as ImageIcon, Paperclip, HardDrive } from "lucide-react";

export default function AccountMedia() {
  const { user } = useMistUser();
  const { data: gallery = [] } = useQuery({
    queryKey: ["account-gallery", user?.id],
    queryFn: () => base44.entities.GatheringPhoto.filter({ created_by_id: user.id }, "-created_date", 1),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  return (
    <div className="space-y-4">
      <SectionCard title="Avatar" desc="Your profile picture, optimized automatically." icon={ImageIcon}>
        <AvatarUploader size={80} />
      </SectionCard>

      <SectionCard title="Banner" desc="The header image on your profile." icon={ImageIcon}>
        <BannerUploader />
      </SectionCard>

      <SectionCard title="Gallery" desc={`${gallery.length} photos you've uploaded.`} icon={ImageIcon}>
        <p className="text-sm text-muted-foreground mb-3">Manage your community photos and gathering memories.</p>
        <Button asChild variant="outline" size="sm"><Link to="/gallery">Open Gallery</Link></Button>
      </SectionCard>

      <SectionCard title="Attachments & Documents" desc="Files you've shared across MIST." icon={Paperclip}>
        <p className="text-sm text-muted-foreground">A unified view of your uploaded documents and attachments is coming soon. Forum and chat attachments remain available in their original locations.</p>
      </SectionCard>

      <SectionCard title="Storage Usage" desc="Your file storage across MIST." icon={HardDrive}>
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary w-1/4" /></div>
          <p className="text-xs text-muted-foreground">Detailed storage metrics require platform support. Avatars and banners are optimized and stored efficiently.</p>
        </div>
      </SectionCard>
    </div>
  );
}
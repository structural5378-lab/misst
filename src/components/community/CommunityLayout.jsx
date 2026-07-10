import React from 'react';
import { useParams, Outlet, useNavigate } from 'react-router-dom';
import { CommunityProvider, useCommunity } from '@/contexts/CommunityContext';
import CommunityBottomNav from './CommunityBottomNav';
import { ChevronLeft, Shield } from 'lucide-react';

export default function CommunityLayout() {
  const { slug } = useParams();
  return (
    <CommunityProvider slug={slug}>
      <CommunityShell />
    </CommunityProvider>
  );
}

function CommunityShell() {
  const { community, loading, error, permissions } = useCommunity();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !community) {
    const errorMsg =
      error?.response?.data?.error ||
      error?.message ||
      'This community may not exist or you do not have access.';
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <p className="text-destructive text-lg font-medium mb-2">Unable to load community</p>
          <p className="text-muted-foreground text-sm mb-4">{errorMsg}</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm hover:underline">
            Return to app
          </button>
        </div>
      </div>
    );
  }

  const isAdmin =
    permissions.community_role === 'community_owner' ||
    permissions.community_role === 'community_admin';

  return (
    <div className="min-h-screen bg-background flex flex-col w-full max-w-full overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div
          className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate('/')} className="p-1 -ml-1 text-muted-foreground shrink-0">
              <ChevronLeft className="w-6 h-6" />
            </button>
            {community.logo_url ? (
              <img src={community.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: community.primary_color || '#8B5CF6' }}
              >
                {community.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-bold text-foreground truncate">{community.name}</span>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate(`/c/${community.slug}/admin`)}
              className="text-muted-foreground hover:text-primary shrink-0 ml-2"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="pb-20 flex-1 w-full max-w-2xl mx-auto overflow-x-hidden">
        <Outlet />
      </main>

      <CommunityBottomNav slug={community.slug} />
    </div>
  );
}
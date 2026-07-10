import React, { createContext, useContext, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CommunityContext = createContext(null);

export function CommunityProvider({ slug, children }) {
  const { data: communityData, isLoading: communityLoading, error: communityError } = useQuery({
    queryKey: ['community-by-slug', slug],
    queryFn: async () => {
      const res = await base44.functions.invoke('getCommunityBySlug', { slug });
      return res.data;
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  const { data: permissionsData, isLoading: permLoading } = useQuery({
    queryKey: ['community-permissions', slug],
    queryFn: async () => {
      const res = await base44.functions.invoke('resolvePermissions', { community_slug: slug });
      return res.data;
    },
    staleTime: 30 * 1000,
    retry: false,
  });

  const community = communityData?.community;
  const settings = communityData?.settings;
  const permissions = permissionsData || {};
  const loading = communityLoading || permLoading;
  const error = communityError;

  const hasPermission = useCallback((perm) => {
    if (permissions.is_platform_owner) return true;
    const allPerms = [
      ...(permissions.platform_permissions || []),
      ...(permissions.community_permissions || []),
    ];
    return allPerms.includes(perm);
  }, [permissions]);

  return (
    <CommunityContext.Provider value={{ community, settings, permissions, hasPermission, loading, error }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider');
  return ctx;
}
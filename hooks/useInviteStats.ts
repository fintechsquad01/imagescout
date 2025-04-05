
import { useState, useEffect } from 'react';
import { InviteStatistics, InviteCodeUI, PaginationState } from '@/types/admin-dashboard';
import { getInviteStats, getRecentInvites } from '@/utils/inviteStats';
import { isDevelopmentMode } from '@/utils/devMode';

export function useInviteStats() {
  const [inviteStats, setInviteStats] = useState<InviteStatistics>({
    total: 0,
    used: 0,
    remaining: 0,
    recentActivity: {
      last24h: 0,
      last7d: 0,
      last30d: 0
    }
  });
  const [inviteCodes, setInviteCodes] = useState<InviteCodeUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const PAGE_SIZE = 10;

  useEffect(() => {
    const loadInviteData = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        // Fetch invite statistics using the utility
        const stats = await getInviteStats();
        setInviteStats(stats);
        
        // Fetch paginated invite codes - already parsed in getRecentInvites
        const parsedInviteCodes = await getRecentInvites(PAGE_SIZE);
        
        setInviteCodes(parsedInviteCodes);
        
        // Update pagination
        setPagination(prev => ({
          ...prev, 
          totalPages: Math.ceil(parsedInviteCodes.length / PAGE_SIZE),
          totalItems: parsedInviteCodes.length
        }));
        
        if (isDevelopmentMode()) {
          console.log('[DEV MODE] Loaded invite data:', { 
            stats, 
            codes: parsedInviteCodes 
          });
        }
      } catch (err) {
        console.error('Error in useInviteStats:', err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInviteData();
  }, [pagination.currentPage]);
  
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  return {
    inviteStats,
    inviteCodes,
    isLoading,
    isError,
    pagination,
    handlePageChange
  };
}

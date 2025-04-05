
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { InviteStatistics, InviteCodeUI, InviteCodeRow } from '@/types/admin-dashboard';
import { toast } from 'sonner';
import { buildInviteFilters } from './buildInviteFilters';
import { InviteCodeFilters } from './index';
import { isDevelopmentMode } from '@/utils/devMode';
import { parseInviteStats, parseInviteCodeRow } from './parseInviteStats';

/**
 * Fetches invite statistics from Supabase and parses them
 */
export async function getInviteStats(): Promise<InviteStatistics> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*');
    
    if (error) {
      console.error('Error fetching invite stats:', error);
      toast.error('Failed to load invite statistics');
      return {
        total: 0,
        used: 0,
        remaining: 0,
        recentActivity: {
          last24h: 0,
          last7d: 0,
          last30d: 0
        }
      };
    }
    
    if (isDevelopmentMode()) {
      console.log('[DEV MODE] Loaded invite stats data:', data);
    }
    
    return parseInviteStats(data);
  } catch (err) {
    console.error('Error in getInviteStats:', err);
    toast.error('Failed to load invite statistics');
    
    return {
      total: 0,
      used: 0,
      remaining: 0,
      recentActivity: {
        last24h: 0,
        last7d: 0,
        last30d: 0
      }
    };
  }
}


import { getSupabaseClient } from '@/lib/supabaseLogger';
import { InviteCodeUI } from '@/types/admin-dashboard';
import { toast } from 'sonner';
import { isDevelopmentMode } from '@/utils/devMode';
import { parseInviteCodeRow } from './parseInviteStats';

/**
 * Fetches the most recent invite code activities
 * @param limit Number of recent invites to fetch
 */
export async function getRecentInvites(limit: number = 5): Promise<InviteCodeUI[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('invite_codes')
      .select(`
        *,
        user_onboarding!invite_code(user_id, created_at),
        auth!user_onboarding(user_id(email)),
        creator:auth!created_by(email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent invites:', error);
      toast.error('Failed to load recent invite activities');
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    if (isDevelopmentMode()) {
      console.log('[DEV MODE] Loaded recent invites data:', data);
    }
    
    // Use our safe parser to transform each row
    const formattedInvites: InviteCodeUI[] = data
      .map(invite => parseInviteCodeRow(invite))
      .filter(Boolean);
    
    return formattedInvites;
  } catch (err) {
    console.error('Error fetching recent invite activities:', err);
    toast.error('Failed to load recent invite activities');
    return [];
  }
}

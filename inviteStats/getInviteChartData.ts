
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { InviteCodeUI, InviteCodeChartData } from '@/types/admin-dashboard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isDevelopmentMode } from '@/utils/devMode';
import { parseInviteCodeRow } from './parseInviteStats';

/**
 * Fetches and formats invite code data for chart visualization, grouped by month
 */
export async function getInviteChartData(): Promise<InviteCodeChartData[]> {
  try {
    const supabase = getSupabaseClient();
    
    // Get invite codes created in the last year
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .gte('created_at', yearAgo.toISOString());
    
    if (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to load invite code chart data');
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Parse raw data to ensure type safety
    const parsedData: InviteCodeUI[] = data
      .map(invite => parseInviteCodeRow(invite))
      .filter(Boolean);
    
    if (isDevelopmentMode()) {
      console.log('[DEV MODE] Processing chart data from invite codes:', parsedData.length);
    }
    
    // Group data by month
    const groupedByMonth: Record<string, number> = {};
    
    parsedData.forEach((invite) => {
      try {
        const date = new Date(invite.created_at);
        const monthKey = format(date, 'MMM yyyy');
        
        if (groupedByMonth[monthKey]) {
          groupedByMonth[monthKey]++;
        } else {
          groupedByMonth[monthKey] = 1;
        }
      } catch (err) {
        if (isDevelopmentMode()) {
          console.warn('[DEV MODE] Error processing invite date for chart:', invite.id, err);
        }
      }
    });
    
    // Convert to array format for charts
    const chartData: InviteCodeChartData[] = Object.entries(groupedByMonth).map(
      ([month, count]) => ({
        month,
        count
      })
    );
    
    // Sort by date (month)
    return chartData.sort((a, b) => {
      // Convert month strings back to Date objects for comparison
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
    
  } catch (err) {
    console.error('Error preparing invite chart data:', err);
    toast.error('Failed to prepare invite code chart data');
    return [];
  }
}

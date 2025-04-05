
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { toast } from "sonner";
import { format, subDays, startOfDay } from 'date-fns';
import { DailyPromptCount, ModelUsage } from '@/types/admin-dashboard';

// Define color mapping for models
const MODEL_COLORS: Record<string, string> = {
  'flux': '#8884d8',
  'trueTouch': '#82ca9d',
  'clarity': '#ffc658',
  'precision': '#ff8042',
  'default': '#888888'
};

export function useUsageStats(dateRange: number) {
  const [dailyPrompts, setDailyPrompts] = useState<DailyPromptCount[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsageStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseClient();
        const endDate = new Date();
        const startDate = subDays(startOfDay(endDate), dateRange);
        
        // Format dates for Supabase
        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();
        
        // Get daily prompt counts using the function
        const { data: promptCountsData, error: promptCountsError } = await supabase
          .rpc('get_daily_prompt_counts', {
            start_date: startDateStr,
            end_date: endDateStr
          });
          
        if (promptCountsError) {
          console.error('Error fetching prompt counts:', promptCountsError);
          setError('Failed to load prompt statistics');
          toast.error('Failed to load prompt statistics');
        } else if (promptCountsData) {
          // Initialize all days in the date range to 0
          const dailyCounts: Record<string, number> = {};
          
          for (let i = 0; i <= dateRange; i++) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            dailyCounts[dateStr] = 0;
          }
          
          // Fill in actual counts from database
          promptCountsData.forEach((item: { date: string, count: number }) => {
            const dateStr = format(new Date(item.date), 'yyyy-MM-dd');
            dailyCounts[dateStr] = Number(item.count);
          });
          
          // Convert to array for the chart
          const dailyCountsArray = Object.entries(dailyCounts)
            .map(([date, count]) => ({
              date,
              count,
              formattedDate: format(new Date(date), 'MMM d')
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
          setDailyPrompts(dailyCountsArray);
        }
        
        // Get model usage statistics using the function
        const { data: modelUsageData, error: modelUsageError } = await supabase
          .rpc('get_model_usage_stats', {
            start_date: startDateStr,
            end_date: endDateStr
          });
          
        if (modelUsageError) {
          console.error('Error fetching model usage:', modelUsageError);
          setError('Failed to load model usage statistics');
          toast.error('Failed to load model usage statistics');
        } else if (modelUsageData) {
          const formattedModelData = modelUsageData.map((item: { model: string, count: number }) => ({
            model: item.model || 'unknown',
            count: Number(item.count),
            color: MODEL_COLORS[item.model as keyof typeof MODEL_COLORS] || MODEL_COLORS.default
          }));
          
          setModelUsage(formattedModelData);
        }
      } catch (err) {
        console.error('Error fetching usage stats:', err);
        setError('Failed to load usage statistics');
        toast.error('Failed to load usage statistics');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsageStats();
  }, [dateRange]);
  
  return { dailyPrompts, modelUsage, isLoading, error };
}

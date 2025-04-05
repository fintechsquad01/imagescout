
import { FeatureFlag } from '@/hooks/useFeatureFlags';

// Chart data types
export interface ChartDataItem {
  name: string;
  positive: number;
  negative: number;
  total: number;
}

export interface DetailChartDataItem {
  name: string;
  value: number;
  fill: string;
}

type SortMethod = 'alphabetical' | 'positive' | 'negative' | 'total';

// Transform intent stats for all intents chart display
export const getIntentChartData = (
  intentStats: Record<string, { positive: number, negative: number }>,
  sortMethod: SortMethod
): ChartDataItem[] => {
  const data: ChartDataItem[] = Object.entries(intentStats).map(([intent, stats]) => ({
    name: intent === 'unknown' ? 'Unknown' : intent,
    positive: stats.positive,
    negative: stats.negative,
    total: stats.positive + stats.negative,
  }));

  // Sort the data based on the selected sort method
  return data.sort((a, b) => {
    switch (sortMethod) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'positive':
        return b.positive - a.positive;
      case 'negative':
        return b.negative - a.negative;
      case 'total':
        return b.total - a.total;
      default:
        return 0;
    }
  });
};

// Get detailed data for specific intent
export const getDetailedIntentData = (
  selectedIntent: string,
  intentStats: Record<string, { positive: number, negative: number }>
): DetailChartDataItem[] => {
  const selectedData = intentStats[selectedIntent];
  if (!selectedData) return [];
  
  return [
    { 
      name: 'Positive', 
      value: selectedData.positive, 
      fill: '#10b981' 
    },
    { 
      name: 'Negative', 
      value: selectedData.negative, 
      fill: '#ef4444' 
    }
  ];
};

// Calculate satisfaction rate
export const calculateSatisfactionRate = (positive: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((positive / total) * 100);
};

// Get unique intent options for the filter dropdown
export const getIntentOptions = (intentStats: Record<string, { positive: number, negative: number }>): string[] => {
  return ['all', ...Object.keys(intentStats)];
};

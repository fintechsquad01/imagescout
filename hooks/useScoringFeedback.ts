import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  FeedbackFormData, 
  FeedbackData, 
  FeedbackAnalytics, 
  mapFeedbackFromSupabase, 
  mapFeedbackFormToSupabase 
} from '@/types/feedback';

export const useScoringFeedback = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const fetchImageFeedback = async (imageId: string): Promise<FeedbackData | null> => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('image_id', imageId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching feedback:', error);
        return null;
      }

      return data ? mapFeedbackFromSupabase(data) : null;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return null;
    }
  };

  const fetchFeedback = async (projectId?: string): Promise<FeedbackData[]> => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching feedback:', error);
        return [];
      }

      const mappedData = (data || []).map(item => mapFeedbackFromSupabase(item));
      setFeedback(mappedData);
      return mappedData;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async (options?: {
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
    scoreRange?: [number, number];
    includeTest?: boolean;
  }): Promise<void> => {
    setIsAnalyticsLoading(true);
    
    try {
      const mockAnalytics: FeedbackAnalytics = {
        totalFeedback: feedback.length,
        timeSeriesData: [
          { date: '2023-01-01', count: 5, avgScore: 85, promotedCount: 2 },
          { date: '2023-01-02', count: 7, avgScore: 78, promotedCount: 3 },
          { date: '2023-01-03', count: 10, avgScore: 92, promotedCount: 5 }
        ],
        scoreDistribution: [
          { score: 10, count: 1, range: '0-20', min: 0, max: 20 },
          { score: 30, count: 3, range: '21-40', min: 21, max: 40 },
          { score: 50, count: 7, range: '41-60', min: 41, max: 60 },
          { score: 70, count: 12, range: '61-80', min: 61, max: 80 },
          { score: 90, count: 8, range: '81-100', min: 81, max: 100 }
        ],
        labelFrequency: [
          { label: 'accurate', count: 15, percentage: 30, name: 'accurate' },
          { label: 'creative', count: 12, percentage: 24, name: 'creative' },
          { label: 'technical', count: 8, percentage: 16, name: 'technical' },
          { label: 'product', count: 7, percentage: 14, name: 'product' },
          { label: 'educational', count: 5, percentage: 10, name: 'educational' }
        ],
        summary: {
          totalFeedback: feedback.length,
          averageRating: feedback.reduce((acc, item) => acc + (item.rating || 0), 0) / (feedback.length || 1),
          averageScore: feedback.reduce((acc, item) => acc + (item.score || 0), 0) / (feedback.length || 1),
          totalLabels: feedback.reduce((acc, item) => acc + (item.labels?.length || 0), 0),
          highestScoringModel: 'TrueTouch',
          uniqueModels: new Set(feedback.map(item => item.modelId)).size,
          uniqueProjects: new Set(feedback.map(item => item.projectId)).size,
          promotedCount: feedback.filter(item => item.promotedToTraining).length,
          testCount: feedback.filter(item => item.test).length,
          scoreTrend: 5.2
        },
        feedbackByModel: feedback.reduce((acc, item) => {
          const modelName = item.modelName || 'Unknown';
          acc[modelName] = (acc[modelName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        feedbackOverTime: [
          { date: '2023-01-01', count: 5 },
          { date: '2023-01-02', count: 7 },
          { date: '2023-01-03', count: 10 }
        ],
        modelPerformance: Object.entries(
          feedback.reduce((acc, item) => {
            const modelId = item.modelId || 'unknown';
            const modelName = item.modelName || 'Unknown';
            
            if (!acc[modelId]) {
              acc[modelId] = { 
                sum: 0, 
                count: 0, 
                name: modelName 
              };
            }
            
            acc[modelId].sum += item.rating;
            acc[modelId].count += 1;
            
            return acc;
          }, {} as Record<string, { sum: number, count: number, name: string }>)
        ).map(([modelId, data]) => ({
          modelId,
          modelName: data.name,
          averageRating: data.sum / data.count,
          feedbackCount: data.count
        })),
        promotedToTraining: feedback.filter(item => item.promotedToTraining).length,
        topLabels: Object.entries(
          feedback.reduce((acc, item) => {
            if (item.labels) {
              item.labels.forEach(label => {
                acc[label] = (acc[label] || 0) + 1;
              });
            }
            return acc;
          }, {} as Record<string, number>)
        )
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const submitFeedback = async (formData: FeedbackFormData): Promise<boolean> => {
    setIsLoading(true);
    setFeedbackStatus('submitting');

    try {
      const supabaseData = mapFeedbackFormToSupabase(formData);

      const { data: existingFeedback, error: checkError } = await supabase
        .from('feedback')
        .select('id')
        .eq('image_id', formData.imageId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing feedback:', checkError);
        setFeedbackStatus('error');
        return false;
      }

      let success;

      if (existingFeedback) {
        const { error: updateError } = await supabase
          .from('feedback')
          .update({
            rating: formData.rating,
            notes: formData.notes,
            labels: formData.labels,
            score: formData.score,
            promoted_to_training: formData.promotedToTraining,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFeedback.id);

        success = !updateError;
        if (updateError) {
          console.error('Error updating feedback:', updateError);
          setFeedbackStatus('error');
        }
      } else {
        const { error: insertError } = await supabase
          .from('feedback')
          .insert([{
            ...supabaseData,
            created_at: new Date().toISOString()
          }]);

        success = !insertError;
        if (insertError) {
          console.error('Error inserting feedback:', insertError);
          setFeedbackStatus('error');
        }
      }

      if (success) {
        setFeedbackStatus('success');
        if (formData.projectId) {
          await fetchFeedback(formData.projectId);
        }
      }

      return success;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackStatus('error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFeedback = async (imageId: string): Promise<boolean> => {
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('image_id', imageId);
        
      if (error) {
        console.error('Error deleting feedback:', error);
        return false;
      }
      
      setFeedback(prevFeedback => prevFeedback.filter(item => item.imageId !== imageId));
      
      return true;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCSV = async (projectId?: string): Promise<void> => {
    setIsExporting(true);
    
    try {
      let dataToExport = feedback;
      if (!dataToExport.length || projectId) {
        dataToExport = await fetchFeedback(projectId);
      }
      
      if (!dataToExport.length) {
        toast.error('No feedback data to export');
        return;
      }
      
      const headers = [
        'ID', 'Image ID', 'Score', 'Rating', 'Notes', 'Labels', 
        'Model ID', 'Model Name', 'Project ID', 'Created At', 'Promoted to Training'
      ];
      
      const csvRows = [
        headers.join(','),
        ...dataToExport.map(item => [
          item.id || '',
          item.imageId,
          item.score,
          item.rating,
          item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '',
          item.labels ? `"${item.labels.join(', ')}"` : '',
          item.modelId || '',
          item.modelName,
          item.projectId || '',
          item.createdAt || '',
          item.promotedToTraining ? 'Yes' : 'No'
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `scoring-feedback-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Feedback data exported successfully');
    } catch (error) {
      console.error('Error exporting feedback data:', error);
      toast.error('Failed to export feedback data');
    } finally {
      setIsExporting(false);
    }
  };
  
  return {
    submitFeedback,
    fetchImageFeedback,
    deleteFeedback,
    fetchFeedback,
    exportToCSV,
    fetchAnalytics,
    isLoading,
    isDeleting,
    isExporting,
    isAnalyticsLoading,
    feedbackStatus,
    feedback,
    analytics
  };
};


import { getSupabaseClient } from '@/lib/supabaseLogger';

export interface UserFeedback {
  generation_id: string;
  image_id: string;
  rating: 'positive' | 'negative';
  comment: string | null;
}

export const submitUserFeedback = async (feedback: UserFeedback): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('user_feedback')
      .insert({
        generation_id: feedback.generation_id,
        image_id: feedback.image_id,
        rating: feedback.rating,
        comment: feedback.comment
      });
      
    if (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error in submitUserFeedback:', err);
    return false;
  }
};

export const getFeedbackStats = async (userId?: string): Promise<{ positive: number, negative: number }> => {
  try {
    const supabase = getSupabaseClient();
    
    // Get all feedback from the last 30 days
    const { data, error } = await supabase
      .from('user_feedback')
      .select('rating')
      .eq(userId ? 'user_id' : 'id', userId || 'id') // If userId is provided, filter by it
      .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
    if (error) {
      console.error('Error getting feedback stats:', error);
      return { positive: 0, negative: 0 };
    }
    
    // Manually count the ratings
    const positive = data.filter(item => item.rating === 'positive').length;
    const negative = data.filter(item => item.rating === 'negative').length;
    
    return { positive, negative };
  } catch (err) {
    console.error('Error in getFeedbackStats:', err);
    return { positive: 0, negative: 0 };
  }
};

// Define the shape of the prompt history object
interface PromptHistoryWithIntent {
  content_intent: string | null;
}

// Define the shape of a feedback item with its related prompt history
interface FeedbackWithPromptHistory {
  rating: string;
  prompt_history: PromptHistoryWithIntent | null;
}

// Raw data structure from Supabase (before transformation)
interface RawFeedbackResponse {
  rating: string;
  prompt_history: Array<{ content_intent: string | null } | null> | null;
}

export const getFeedbackByContentIntent = async (): Promise<Record<string, { positive: number, negative: number }>> => {
  try {
    const supabase = getSupabaseClient();
    
    // Join user_feedback with prompt_history to get content_intent
    const { data: rawData, error } = await supabase
      .from('user_feedback')
      .select(`
        rating,
        prompt_history:generation_id (content_intent)
      `)
      .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
    if (error) {
      console.error('Error getting feedback by intent:', error);
      return {};
    }
    
    if (!rawData || !Array.isArray(rawData)) {
      console.error('Invalid data returned from Supabase');
      return {};
    }
    
    // Transform the raw data into our expected shape
    const data: FeedbackWithPromptHistory[] = (rawData as RawFeedbackResponse[]).map(item => ({
      rating: item.rating,
      // Extract the first item from the prompt_history array or use a default
      prompt_history: item.prompt_history && item.prompt_history.length > 0 && item.prompt_history[0] 
        ? { content_intent: item.prompt_history[0].content_intent } 
        : { content_intent: 'unknown' }
    }));
    
    // Manually aggregate by content intent
    const result: Record<string, { positive: number, negative: number }> = {};
    
    data.forEach(item => {
      // Skip items with missing prompt_history - should never happen now with our default
      if (!item.prompt_history) return;
      
      const intent = item.prompt_history.content_intent || 'unknown';
      
      if (!result[intent]) {
        result[intent] = { positive: 0, negative: 0 };
      }
      
      if (item.rating === 'positive') {
        result[intent].positive += 1;
      } else if (item.rating === 'negative') {
        result[intent].negative += 1;
      }
    });
    
    return result;
  } catch (err) {
    console.error('Error in getFeedbackByContentIntent:', err);
    return {};
  }
};

// Get total feedback count
export const getTotalFeedbackCount = async (): Promise<number> => {
  try {
    const supabase = getSupabaseClient();
    
    const { count, error } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Error getting total feedback count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (err) {
    console.error('Error in getTotalFeedbackCount:', err);
    return 0;
  }
};

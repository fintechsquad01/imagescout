
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { toast } from "sonner";
import { UserRoleCounts, UserActivity, PaginationState } from '@/types/admin-dashboard';

// Role color mapping
const ROLE_COLORS = {
  admin: '#FF6384',
  internal: '#36A2EB',
  beta: '#FFCE56',
  user: '#4BC0C0'
};

const PAGE_SIZE = 10;

export function useUserStats(initialPage: number = 1) {
  const [roleCounts, setRoleCounts] = useState<UserRoleCounts[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: initialPage,
    totalPages: 1,
    totalItems: 0
  });

  const fetchUserData = async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // Get role counts using the SQL function
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role_counts');
      
      if (roleError) {
        console.error('Error fetching role counts:', roleError);
        setError('Failed to load user role statistics');
        toast.error('Failed to load user role statistics');
      } else if (roleData) {
        // Transform data for the chart
        const formattedData = roleData.map((item: { role: string, count: number }) => ({
          role: item.role || 'user',
          count: Number(item.count),
          color: ROLE_COLORS[item.role as keyof typeof ROLE_COLORS] || '#999999'
        }));
        
        setRoleCounts(formattedData);
      }
      
      // Get user details with pagination using the view
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      // First get total count for pagination
      const { count, error: countError } = await supabase
        .from('user_role_details')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Error fetching user count:', countError);
        setError('Failed to count users');
      } else if (count !== null) {
        setPagination({
          currentPage: page,
          totalPages: Math.ceil(count / PAGE_SIZE),
          totalItems: count
        });
      }
      
      // Now get the actual data for current page
      const { data: userData, error: userError } = await supabase
        .from('user_role_details')
        .select('id, user_id, role, email, last_sign_in_at')
        .order('role', { ascending: false })
        .range(from, to);
        
      if (userError) {
        console.error('Error fetching user activity:', userError);
        setError('Failed to load user activity data');
        toast.error('Failed to load user activity data');
      } else if (userData) {
        // Format the data
        const formattedUsers = userData.map(item => ({
          id: item.user_id,
          email: item.email || 'No email',
          role: item.role,
          last_sign_in_at: item.last_sign_in_at
        }));
        
        setRecentUsers(formattedUsers);
      }
    } catch (err) {
      console.error('Error in fetchUserStats:', err);
      setError('Failed to load user statistics');
      toast.error('Failed to load user statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData(pagination.currentPage);
  }, [pagination.currentPage]);
  
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };
  
  return { 
    roleCounts, 
    recentUsers, 
    isLoading, 
    error,
    pagination,
    handlePageChange
  };
}


import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from "sonner";
import { isDevelopmentMode, logRoleBypass } from '@/utils/devMode';

export function useRoleCheck(allowedRoles: string[]) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, userId } = useSupabaseAuth();

  useEffect(() => {
    const checkUserRole = async () => {
      // Development mode bypass - grant all roles in development
      if (isDevelopmentMode()) {
        logRoleBypass(allowedRoles);
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      if (!isAuthenticated || !userId) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const supabase = getSupabaseClient();
        
        // Check if user has any of the allowed roles
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error checking user roles:', error);
          toast.error('Error verifying access permissions');
          setIsAuthorized(false);
          return;
        }
        
        if (userRoles && userRoles.length > 0) {
          // Check if user has at least one of the allowed roles
          const hasAllowedRole = userRoles.some(ur => 
            allowedRoles.includes(ur.role)
          );
          
          setIsAuthorized(hasAllowedRole);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error('Error in role check:', err);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserRole();
  }, [isAuthenticated, userId, allowedRoles]);
  
  return { isAuthorized, isLoading };
}

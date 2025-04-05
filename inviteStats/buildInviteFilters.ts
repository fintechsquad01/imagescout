
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { InviteCodeFilters } from './index';
import { isDevelopmentMode } from '@/utils/devMode';

/**
 * Applies date range filters to a Supabase query
 */
export function applyDateRangeFilter<T>(
  query: PostgrestFilterBuilder<any, any, T[]>, 
  startDate?: string,
  endDate?: string
): PostgrestFilterBuilder<any, any, T[]> {
  let filteredQuery = query;
  
  if (startDate) {
    filteredQuery = filteredQuery.gte('created_at', startDate);
  }
  
  if (endDate) {
    filteredQuery = filteredQuery.lte('created_at', endDate);
  }
  
  return filteredQuery;
}

/**
 * Applies creator filter to a Supabase query
 */
export function applyCreatorFilter<T>(
  query: PostgrestFilterBuilder<any, any, T[]>, 
  createdBy?: string
): PostgrestFilterBuilder<any, any, T[]> {
  if (createdBy) {
    return query.eq('created_by', createdBy);
  }
  return query;
}

/**
 * Applies status filter to a Supabase query
 */
export function applyStatusFilter<T>(
  query: PostgrestFilterBuilder<any, any, T[]>, 
  status?: 'all' | 'active' | 'used' | 'inactive'
): PostgrestFilterBuilder<any, any, T[]> {
  if (status && status !== 'all') {
    switch (status) {
      case 'active':
        return query
          .eq('is_active', true)
          .eq('uses', 0);
      case 'used':
        return query
          .gt('uses', 0);
      case 'inactive':
        return query
          .eq('is_active', false);
      default:
        if (isDevelopmentMode()) {
          console.warn(`[DEV MODE] Invalid status filter: ${status}, defaulting to 'all'`);
        }
        return query;
    }
  }
  return query;
}

/**
 * Builds a filtered Supabase query based on provided filter criteria
 */
export function buildInviteFilters<T>(
  query: PostgrestFilterBuilder<any, any, T[]>,
  filters?: InviteCodeFilters
): PostgrestFilterBuilder<any, any, T[]> {
  let filteredQuery = query;
  
  if (filters) {
    // Apply date range filter
    filteredQuery = applyDateRangeFilter(
      filteredQuery, 
      filters.startDate, 
      filters.endDate
    );
    
    // Apply creator filter
    filteredQuery = applyCreatorFilter(filteredQuery, filters.created_by);
    
    // Apply status filter with type guard
    if (filters.status && ['active', 'used', 'inactive', 'all'].includes(filters.status)) {
      filteredQuery = applyStatusFilter(
        filteredQuery, 
        filters.status as 'all' | 'active' | 'used' | 'inactive'
      );
    } else if (filters.status && isDevelopmentMode()) {
      console.warn(`[DEV MODE] Skipping invalid status filter: ${filters.status}`);
    }
  }
  
  return filteredQuery;
}

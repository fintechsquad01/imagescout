
import { InviteStatistics, InviteCodeRow, InviteCodeUI } from '@/types/admin-dashboard';
import { isDevelopmentMode } from '@/utils/devMode';

/**
 * Safely parses a raw invite code row from Supabase into a frontend-ready format
 * with derived fields and fallbacks for missing values
 */
export function parseInviteCodeRow(row: any): InviteCodeUI {
  if (!row) {
    if (isDevelopmentMode()) {
      console.warn('[DEV MODE] Attempted to parse undefined invite code row');
    }
    
    // Return minimal valid InviteCodeUI object with default values
    return {
      id: `default-${Date.now()}`,
      code: 'INVALID',
      description: '',
      max_uses: 1,
      uses: 0,
      expires_at: null,
      created_by: 'unknown',
      created_at: new Date().toISOString(),
      is_active: false,
      user_email: 'Not used',
      creator_email: 'System'
    };
  }

  // Extract user email from nested join data if available
  let userEmail = 'Not used';
  if (Array.isArray(row.user_onboarding) && row.user_onboarding.length > 0) {
    const userId = row.user_onboarding[0]?.user_id;
    if (Array.isArray(row.auth) && row.auth.length > 0) {
      const user = row.auth.find((u: any) => u.user_id === userId);
      if (user && user.email) {
        userEmail = user.email;
      }
    }
  } else if (row.user && row.user.email) {
    // Direct user object format
    userEmail = row.user.email;
  }

  // Extract creator email
  const creatorEmail = row.creator?.email || 'System';

  // Log warnings for missing fields in development
  if (isDevelopmentMode()) {
    if (!row.id) console.warn('[DEV MODE] Invite code missing ID');
    if (!row.code) console.warn('[DEV MODE] Invite code missing code value');
  }

  // Use is_active if available, otherwise fall back to active field
  const isActive = typeof row.is_active !== 'undefined' 
    ? !!row.is_active 
    : typeof row.active !== 'undefined' 
      ? !!row.active 
      : false;
  
  // Extract last used date
  const lastUsedAt = row.lastUsedAt || row.used_at || null;
  
  // Parse users array from user_onboarding if available
  const users = Array.isArray(row.user_onboarding) 
    ? row.user_onboarding.map((u: any) => u.user_id).filter(Boolean)
    : row.user 
      ? [row.user.id].filter(Boolean)
      : [];

  return {
    id: row.id || `temp-${Date.now()}`,
    code: row.code || 'INVALID',
    description: row.description || '',
    max_uses: typeof row.max_uses === 'number' ? row.max_uses : 1,
    uses: typeof row.uses === 'number' ? row.uses : 0,
    expires_at: row.expires_at || null,
    created_by: row.created_by || 'unknown',
    created_at: row.created_at || new Date().toISOString(),
    is_active: isActive,
    user_email: userEmail,
    creator_email: creatorEmail,
    role: row.role,
    lastUsedAt,
    users
  };
}

/**
 * Parses raw invite stats data into a structured format
 */
export function parseInviteStats(statsData: InviteCodeRow[] | null): InviteStatistics {
  // Default stats structure if no data is available
  const defaultStats: InviteStatistics = {
    total: 0,
    used: 0,
    remaining: 0,
    recentActivity: {
      last24h: 0,
      last7d: 0,
      last30d: 0
    }
  };
  
  if (!statsData || statsData.length === 0) {
    return defaultStats;
  }
  
  // Calculate basic stats
  const total = statsData.length;
  
  // Use the parser to safely map each row
  const parsedCodes = statsData.map(row => parseInviteCodeRow(row));
  
  const used = parsedCodes.filter(code => code.uses > 0).length;
  const remaining = parsedCodes.filter(
    code => code.is_active && (code.max_uses === 0 || code.uses < code.max_uses)
  ).length;
  
  // Calculate recent activity metrics
  const now = new Date();
  
  const last24h = parsedCodes.filter(code => {
    const createdAt = new Date(code.created_at);
    return (now.getTime() - createdAt.getTime()) <= 24 * 60 * 60 * 1000;
  }).length;
  
  const last7d = parsedCodes.filter(code => {
    const createdAt = new Date(code.created_at);
    return (now.getTime() - createdAt.getTime()) <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  
  const last30d = parsedCodes.filter(code => {
    const createdAt = new Date(code.created_at);
    return (now.getTime() - createdAt.getTime()) <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  
  return {
    total,
    used,
    remaining,
    recentActivity: {
      last24h,
      last7d,
      last30d
    }
  };
}

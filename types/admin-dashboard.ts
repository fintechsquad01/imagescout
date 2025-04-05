
import { RoleType } from '@/types/types';

// User stats types
export interface UserRoleCounts {
  role: string;
  count: number;
  color: string;
}

export interface UserActivity {
  id: string;
  email: string;
  role: string;
  last_sign_in_at: string | null;
}

// Usage stats types
export interface DailyPromptCount {
  date: string;
  count: number;
  formattedDate: string;
}

export interface ModelUsage {
  model: string;
  count: number;
  color: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface AdminDashboardSectionProps {
  title: string;
  description?: string;
}

// Invite code types
export interface InviteStatistics {
  total: number;
  used: number;
  remaining: number;
  recentActivity?: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

// Raw database row shape (as received from Supabase)
export interface InviteCodeRow {
  id: string;
  code: string;
  description?: string;
  max_uses?: number;
  uses?: number;
  expires_at?: string | null;
  created_by?: string;
  created_at: string;
  is_active?: boolean;
  active?: boolean; // Legacy field name
  role?: string;
  used_at?: string | null;
  user?: any; // Raw user object from join
  user_onboarding?: any[]; // Raw user_onboarding data from join
  auth?: any[]; // Raw auth data from join
  creator?: { email?: string }; // Creator data from join
}

// Frontend-ready shape with derived and processed fields
export interface InviteCodeUI {
  id: string;
  code: string;
  description: string;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  is_active: boolean;
  user_email: string;
  creator_email: string;
  role?: string;
  lastUsedAt?: string | null;
  users?: string[];
}

export interface InviteCodeChartData {
  month: string;
  count: number;
}

// Feedback chart types
export interface InviteCodeFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  created_by?: string;
}

// Feedback types
export interface FeedbackByIntent {
  intent: string;
  positive: number;
  negative: number;
  total: number;
}

// Billing types
export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  color?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string;
  cancel_at_period_end: boolean;
}

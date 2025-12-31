import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface DailyAnalytics {
  id: string;
  user_id: string;
  date: string;
  jobs_fetched: number;
  jobs_auto_applied: number;
  jobs_manual_required: number;
  jobs_applied: number;
  jobs_rejected: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  total_jobs_fetched: number;
  total_auto_applied: number;
  total_manual_required: number;
  total_applied: number;
  total_rejected: number;
  success_rate: number;
  daily_data: DailyAnalytics[];
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (days: number = 30) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('job_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      const dailyData = data || [];

      const summary: AnalyticsSummary = {
        total_jobs_fetched: dailyData.reduce((sum, d) => sum + (d.jobs_fetched || 0), 0),
        total_auto_applied: dailyData.reduce((sum, d) => sum + (d.jobs_auto_applied || 0), 0),
        total_manual_required: dailyData.reduce((sum, d) => sum + (d.jobs_manual_required || 0), 0),
        total_applied: dailyData.reduce((sum, d) => sum + (d.jobs_applied || 0), 0),
        total_rejected: dailyData.reduce((sum, d) => sum + (d.jobs_rejected || 0), 0),
        success_rate: 0,
        daily_data: dailyData,
      };

      const totalApplications = summary.total_applied + summary.total_auto_applied;
      if (totalApplications > 0) {
        summary.success_rate = Math.round(
          ((totalApplications - summary.total_rejected) / totalApplications) * 100
        );
      }

      setAnalytics(summary);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics,
  };
};

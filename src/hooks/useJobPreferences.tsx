import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type RemotePreference = Database['public']['Enums']['remote_preference'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

export type AutoApplySchedule = 'now' | 'after_1hr' | 'daily_automatic' | 'manual';

export interface JobPreferences {
  id: string;
  user_id: string;
  desired_roles: string[];
  min_salary: number | null;
  max_salary: number | null;
  salary_currency: string;
  locations: string[];
  remote_preference: RemotePreference;
  experience_level: ExperienceLevel;
  job_types: string[];
  industries: string[];
  auto_apply_enabled: boolean;
  auto_apply_threshold: number;
  auto_apply_daily_limit: number;
  auto_apply_schedule: AutoApplySchedule;
  auto_apply_email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobPreferencesInput {
  desired_roles?: string[];
  min_salary?: number | null;
  max_salary?: number | null;
  salary_currency?: string;
  locations?: string[];
  remote_preference?: RemotePreference;
  experience_level?: ExperienceLevel;
  job_types?: string[];
  industries?: string[];
  auto_apply_enabled?: boolean;
  auto_apply_threshold?: number;
  auto_apply_daily_limit?: number;
  auto_apply_schedule?: AutoApplySchedule;
  auto_apply_email_notifications?: boolean;
}

export const useJobPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<JobPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('job_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPreferences({
          ...data,
          auto_apply_schedule: (data.auto_apply_schedule as AutoApplySchedule) || 'manual',
          auto_apply_email_notifications: data.auto_apply_email_notifications ?? true,
        });
      } else {
        setPreferences(null);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = async (input: JobPreferencesInput) => {
    if (!user) {
      toast.error('Please sign in to save preferences');
      return null;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('job_preferences')
        .upsert({
          user_id: user.id,
          ...input,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      
      setPreferences({
        ...data,
        auto_apply_schedule: (data.auto_apply_schedule as AutoApplySchedule) || 'manual',
        auto_apply_email_notifications: data.auto_apply_email_notifications ?? true,
      });
      toast.success('Preferences saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    refetch: fetchPreferences,
  };
};

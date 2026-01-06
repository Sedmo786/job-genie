import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import type { Database, Json } from '@/integrations/supabase/types';

type ApplicationStatus = Database['public']['Enums']['application_status'];
type ApplicationRow = Database['public']['Tables']['applications']['Row'];

export type Application = ApplicationRow;

export interface ApplicationInput {
  job_posting_id?: string;
  job_title: string;
  company_name: string;
  company_logo_url?: string;
  job_url?: string;
  job_description?: string;
  status?: ApplicationStatus;
  applied_at?: string;
  notes?: string;
  match_score?: number;
  match_reasons?: Json;
  salary_range?: string;
  location?: string;
  work_type?: string;
}

export const useApplications = () => {
  const { user } = useAuth();
  const { sendStatusUpdateNotification, sendApplicationCompleteNotification } = useNotifications();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addApplication = async (input: ApplicationInput, sendNotification = true) => {
    if (!user) {
      toast.error('Please sign in');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      
      setApplications(prev => [data, ...prev]);
      toast.success('Application added');
      
      // Send notification for new application
      if (sendNotification && (input.status === 'applied' || input.status === 'auto_applied')) {
        sendApplicationCompleteNotification({
          job_title: data.job_title,
          company_name: data.company_name,
          status: data.status,
          job_url: data.job_url || undefined,
          location: data.location || undefined,
          match_score: data.match_score || undefined,
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error adding application:', error);
      toast.error('Failed to add application');
      return null;
    }
  };

  const updateApplication = async (id: string, updates: Partial<ApplicationInput>, sendNotification = true) => {
    if (!user) return null;

    const previousApp = applications.find(a => a.id === id);

    try {
      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setApplications(prev => prev.map(a => a.id === id ? data : a));
      toast.success('Application updated');
      
      // Send notification if status changed
      if (sendNotification && updates.status && previousApp?.status !== updates.status) {
        const notifiableStatuses = ['screening', 'interviewing', 'offer', 'rejected'];
        if (notifiableStatuses.includes(updates.status)) {
          sendStatusUpdateNotification({
            job_title: data.job_title,
            company_name: data.company_name,
            status: data.status,
            job_url: data.job_url || undefined,
            location: data.location || undefined,
          });
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
      return null;
    }
  };

  const deleteApplication = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setApplications(prev => prev.filter(a => a.id !== id));
      toast.success('Application removed');
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to remove application');
      return false;
    }
  };

  const getStatsByStatus = useCallback(() => {
    const stats: Record<ApplicationStatus, number> = {
      saved: 0,
      applied: 0,
      auto_applied: 0,
      screening: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
      manual_required: 0,
      failed: 0,
    };

    applications.forEach(app => {
      stats[app.status]++;
    });

    return stats;
  }, [applications]);

  return {
    applications,
    loading,
    addApplication,
    updateApplication,
    deleteApplication,
    refetch: fetchApplications,
    getStatsByStatus,
  };
};

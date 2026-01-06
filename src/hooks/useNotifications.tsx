import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface JobMatch {
  job_title: string;
  company_name: string;
  match_score: number;
  job_url?: string;
  location?: string;
}

interface Application {
  job_title: string;
  company_name: string;
  status: string;
  job_url?: string;
  location?: string;
  match_score?: number;
}

export const useNotifications = () => {
  const { user, session } = useAuth();

  const sendNewMatchesNotification = useCallback(async (matches: JobMatch[]) => {
    if (!user || !session || matches.length === 0) return;

    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'new_job_matches',
          matches,
        },
      });

      if (error) {
        console.error('Failed to send matches notification:', error);
      }
    } catch (error) {
      console.error('Error sending matches notification:', error);
    }
  }, [user, session]);

  const sendStatusUpdateNotification = useCallback(async (application: Application) => {
    if (!user || !session) return;

    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'status_update',
          statusUpdate: application,
        },
      });

      if (error) {
        console.error('Failed to send status update notification:', error);
      }
    } catch (error) {
      console.error('Error sending status update notification:', error);
    }
  }, [user, session]);

  const sendApplicationCompleteNotification = useCallback(async (application: Application) => {
    if (!user || !session) return;

    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'application_complete',
          applications: [application],
        },
      });

      if (error) {
        console.error('Failed to send application complete notification:', error);
      }
    } catch (error) {
      console.error('Error sending application complete notification:', error);
    }
  }, [user, session]);

  const sendDailySummaryNotification = useCallback(async (applications: Application[]) => {
    if (!user || !session || applications.length === 0) return;

    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'daily_summary',
          applications,
        },
      });

      if (error) {
        console.error('Failed to send daily summary notification:', error);
      }
    } catch (error) {
      console.error('Error sending daily summary notification:', error);
    }
  }, [user, session]);

  return {
    sendNewMatchesNotification,
    sendStatusUpdateNotification,
    sendApplicationCompleteNotification,
    sendDailySummaryNotification,
  };
};

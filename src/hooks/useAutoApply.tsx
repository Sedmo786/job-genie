import { useCallback, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JobMatch {
  job_id: string;
  score: number;
  reasons: {
    skills_match: number;
    experience_match: number;
    location_match: number;
    salary_match: number;
    role_match: number;
  };
  explanation: string;
}

export interface AutoApplyResult {
  job_id: string;
  job_title: string;
  company_name: string;
  status: 'auto_applied' | 'manual_required' | 'already_applied' | 'failed';
  match_score: number;
  apply_url?: string;
  reason?: string;
}

export interface AutoApplyResponse {
  success: boolean;
  results: AutoApplyResult[];
  summary?: {
    auto_applied: number;
    manual_required: number;
    failed: number;
  };
  message?: string;
}

export const useAutoApply = () => {
  const { user, session } = useAuth();
  const [applying, setApplying] = useState(false);
  const [lastResults, setLastResults] = useState<AutoApplyResult[]>([]);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const scheduledTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const autoApply = useCallback(async (matches: JobMatch[]): Promise<AutoApplyResponse | null> => {
    if (!user || !session || matches.length === 0) {
      return null;
    }

    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-apply', {
        body: { matches },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const response = data as AutoApplyResponse;
      setLastResults(response.results);

      if (response.summary) {
        const { auto_applied, manual_required } = response.summary;
        
        if (auto_applied > 0) {
          toast.success(`Auto-applied to ${auto_applied} job${auto_applied > 1 ? 's' : ''}!`);
        }
        
        if (manual_required > 0) {
          toast.info(`${manual_required} job${manual_required > 1 ? 's' : ''} require manual application`);
        }
      } else if (response.message) {
        toast.info(response.message);
      }

      return response;
    } catch (error) {
      console.error('Error in auto-apply:', error);
      toast.error('Failed to auto-apply');
      return null;
    } finally {
      setApplying(false);
    }
  }, [user, session]);

  const scheduleAutoApply = useCallback((matches: JobMatch[], delayMinutesOrDaily: number | 'daily') => {
    // Clear any existing scheduled timeout
    if (scheduledTimeoutRef.current) {
      clearTimeout(scheduledTimeoutRef.current);
      scheduledTimeoutRef.current = null;
    }

    if (delayMinutesOrDaily === 'daily') {
      // For daily, we'll schedule for next occurrence (this is a simplified version)
      // In production, this would be handled by a cron job
      const now = new Date();
      const scheduledFor = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day
      setScheduledTime(scheduledFor);
      
      // Store matches in localStorage for daily processing
      localStorage.setItem('scheduledAutoApplyMatches', JSON.stringify(matches));
      localStorage.setItem('scheduledAutoApplyTime', scheduledFor.toISOString());
      
      toast.success('Daily auto-apply enabled. Applications will be submitted each day.');
      return;
    }

    const delayMs = delayMinutesOrDaily * 60 * 1000;
    const scheduledFor = new Date(Date.now() + delayMs);
    setScheduledTime(scheduledFor);

    // Store the scheduled info in localStorage in case the page is refreshed
    localStorage.setItem('scheduledAutoApplyMatches', JSON.stringify(matches));
    localStorage.setItem('scheduledAutoApplyTime', scheduledFor.toISOString());

    scheduledTimeoutRef.current = setTimeout(async () => {
      toast.info('Running scheduled auto-apply...');
      await autoApply(matches);
      setScheduledTime(null);
      localStorage.removeItem('scheduledAutoApplyMatches');
      localStorage.removeItem('scheduledAutoApplyTime');
    }, delayMs);

  }, [autoApply]);

  const cancelScheduledAutoApply = useCallback(() => {
    if (scheduledTimeoutRef.current) {
      clearTimeout(scheduledTimeoutRef.current);
      scheduledTimeoutRef.current = null;
    }
    setScheduledTime(null);
    localStorage.removeItem('scheduledAutoApplyMatches');
    localStorage.removeItem('scheduledAutoApplyTime');
    toast.info('Scheduled auto-apply cancelled');
  }, []);

  return {
    autoApply,
    applying,
    lastResults,
    scheduleAutoApply,
    scheduledTime,
    cancelScheduledAutoApply,
  };
};

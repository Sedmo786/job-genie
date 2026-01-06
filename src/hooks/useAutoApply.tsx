import { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

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

interface AutoApplyResult {
  job_id: string;
  job_title: string;
  company_name: string;
  status: 'auto_applied' | 'manual_required' | 'already_applied' | 'failed';
  match_score: number;
  apply_url?: string;
  reason?: string;
}

interface AutoApplyResponse {
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
  const { sendApplicationCompleteNotification, sendDailySummaryNotification } = useNotifications();
  const [applying, setApplying] = useState(false);
  const [lastResults, setLastResults] = useState<AutoApplyResult[]>([]);

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
          
          // Send notification for auto-applied jobs
          const autoAppliedJobs = response.results.filter(r => r.status === 'auto_applied');
          if (autoAppliedJobs.length > 0) {
            sendDailySummaryNotification(autoAppliedJobs.map(j => ({
              job_title: j.job_title,
              company_name: j.company_name,
              status: 'auto_applied',
            })));
          }
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
  }, [user, session, sendDailySummaryNotification]);

  return {
    autoApply,
    applying,
    lastResults,
  };
};

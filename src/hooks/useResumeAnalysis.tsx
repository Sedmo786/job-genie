import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ResumeAnalysisRow = Database['public']['Tables']['resume_analysis']['Row'];
export type ResumeAnalysis = ResumeAnalysisRow;

export const useResumeAnalysis = () => {
  const { user, session } = useAuth();
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('resume_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching resume analysis:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const analyzeResume = async (resumeId: string) => {
    if (!user || !session) {
      toast.error('Please sign in');
      return null;
    }

    setAnalyzing(true);
    const toastId = toast.loading('Analyzing your resume with AI...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Resume analyzed successfully!', { id: toastId });
      
      await fetchAnalysis();
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze resume', { id: toastId });
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    analysis,
    loading,
    analyzing,
    analyzeResume,
    refetch: fetchAnalysis,
  };
};

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import type { Database } from '@/integrations/supabase/types';

type ExperienceLevel = Database['public']['Enums']['experience_level'];

export interface JobPosting {
  id: string;
  external_id: string;
  source: string;
  title: string;
  company: string;
  company_logo_url: string | null;
  description: string | null;
  required_skills: string[];
  location: string | null;
  work_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  experience_level: ExperienceLevel | null;
  employment_type: string | null;
  apply_url: string | null;
  posted_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobMatch {
  job: JobPosting;
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

export const useJobs = () => {
  const { user, session } = useAuth();
  const { sendNewMatchesNotification } = useNotifications();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchJobs = useCallback(async (query?: string, location?: string, remoteOnly?: boolean, resetPage?: boolean) => {
    if (!user) {
      toast.error('Please sign in');
      return;
    }

    // Refresh session before making the call
    const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !freshSession) {
      toast.error('Session expired. Please sign in again.');
      return;
    }

    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-jobs', {
        body: { query, location, page: currentPage, remote_only: remoteOnly },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      const fetchedJobs = data.jobs || [];
      
      if (resetPage) {
        setJobs(fetchedJobs);
      } else {
        setJobs(prev => [...prev, ...fetchedJobs]);
      }
      
      setHasMore(fetchedJobs.length >= 9);
      
      if (fetchedJobs.length > 0) {
        toast.success(`Found ${fetchedJobs.length} jobs`);
      } else {
        toast.info('No jobs found. Try different search terms.');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [user, session, page]);

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const matchJobs = useCallback(async (jobIds: string[], sendNotification = false) => {
    if (!user || jobIds.length === 0) return;

    // Refresh session before making the call
    const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !freshSession) {
      toast.error('Session expired. Please sign in again.');
      return;
    }

    setMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-jobs', {
        body: { jobIds },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const matches = data.matches || [];
      
      // Combine job data with match scores
      const matchedJobsData: JobMatch[] = matches.map((match: { job_id: string; score: number; reasons: JobMatch['reasons']; explanation: string }) => {
        const job = jobs.find(j => j.id === match.job_id);
        return job ? {
          job,
          score: match.score,
          reasons: match.reasons,
          explanation: match.explanation,
        } : null;
      }).filter(Boolean) as JobMatch[];

      setMatchedJobs(matchedJobsData);

      // Send notification for high-quality matches
      if (sendNotification && matchedJobsData.length > 0) {
        const goodMatches = matchedJobsData.filter(m => m.score >= 60);
        if (goodMatches.length > 0) {
          sendNewMatchesNotification(goodMatches.map(m => ({
            job_title: m.job.title,
            company_name: m.job.company,
            match_score: m.score,
            job_url: m.job.apply_url || undefined,
            location: m.job.location || undefined,
          })));
        }
      }

      if (!data.user_has_analysis) {
        toast.info('Upload and analyze your resume for better job matching');
      }
      if (!data.user_has_preferences) {
        toast.info('Set your job preferences for more accurate matches');
      }
    } catch (error) {
      console.error('Error matching jobs:', error);
      toast.error('Failed to match jobs');
    } finally {
      setMatching(false);
    }
  }, [user, session, jobs, sendNewMatchesNotification]);

  const getJobById = useCallback(async (id: string): Promise<JobPosting | null> => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  }, []);

  return {
    jobs,
    matchedJobs,
    loading,
    matching,
    hasMore,
    page,
    fetchJobs,
    loadMore,
    matchJobs,
    getJobById,
  };
};

-- Create enums
CREATE TYPE public.remote_preference AS ENUM ('remote', 'hybrid', 'onsite', 'any');
CREATE TYPE public.experience_level AS ENUM ('entry', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE public.application_status AS ENUM ('saved', 'applied', 'auto_applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn', 'manual_required', 'failed');

-- Job Preferences table
CREATE TABLE public.job_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  desired_roles TEXT[] DEFAULT '{}',
  min_salary INTEGER,
  max_salary INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  locations TEXT[] DEFAULT '{}',
  remote_preference public.remote_preference DEFAULT 'any',
  experience_level public.experience_level DEFAULT 'mid',
  job_types TEXT[] DEFAULT ARRAY['full-time'],
  industries TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.job_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON public.job_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.job_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.job_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own preferences" ON public.job_preferences FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_job_preferences_updated_at
  BEFORE UPDATE ON public.job_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Resume Analysis table (AI-extracted data)
CREATE TABLE public.resume_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  education JSONB DEFAULT '[]',
  work_history JSONB DEFAULT '[]',
  summary TEXT,
  raw_text TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resume_id)
);

ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume analysis" ON public.resume_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resume analysis" ON public.resume_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resume analysis" ON public.resume_analysis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resume analysis" ON public.resume_analysis FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_resume_analysis_updated_at
  BEFORE UPDATE ON public.resume_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job Postings table (cached from external APIs)
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'jsearch',
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo_url TEXT,
  description TEXT,
  required_skills TEXT[] DEFAULT '{}',
  location TEXT,
  work_type TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT,
  experience_level public.experience_level,
  employment_type TEXT,
  apply_url TEXT,
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(external_id, source)
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Job postings are readable by all authenticated users
CREATE POLICY "Authenticated users can view job postings" ON public.job_postings FOR SELECT TO authenticated USING (true);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  job_url TEXT,
  job_description TEXT,
  status public.application_status NOT NULL DEFAULT 'saved',
  applied_at TIMESTAMPTZ,
  notes TEXT,
  match_score INTEGER,
  match_reasons JSONB DEFAULT '{}',
  salary_range TEXT,
  location TEXT,
  work_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own applications" ON public.applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own applications" ON public.applications FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Analytics table for tracking metrics
CREATE TABLE public.job_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  jobs_fetched INTEGER DEFAULT 0,
  jobs_auto_applied INTEGER DEFAULT 0,
  jobs_manual_required INTEGER DEFAULT 0,
  jobs_applied INTEGER DEFAULT 0,
  jobs_rejected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.job_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics" ON public.job_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics" ON public.job_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analytics" ON public.job_analytics FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_job_analytics_updated_at
  BEFORE UPDATE ON public.job_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
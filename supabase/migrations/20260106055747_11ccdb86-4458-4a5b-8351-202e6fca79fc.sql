-- Add auto-apply settings to job_preferences
ALTER TABLE public.job_preferences 
ADD COLUMN IF NOT EXISTS auto_apply_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_apply_threshold integer DEFAULT 75 CHECK (auto_apply_threshold >= 50 AND auto_apply_threshold <= 100),
ADD COLUMN IF NOT EXISTS auto_apply_daily_limit integer DEFAULT 10 CHECK (auto_apply_daily_limit >= 1 AND auto_apply_daily_limit <= 50);
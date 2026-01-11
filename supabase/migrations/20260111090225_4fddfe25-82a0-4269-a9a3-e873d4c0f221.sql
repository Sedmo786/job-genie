-- Add auto_apply_schedule column to job_preferences
-- Values: 'now', 'after_1hr', 'daily_automatic', 'manual'
ALTER TABLE public.job_preferences 
ADD COLUMN IF NOT EXISTS auto_apply_schedule text DEFAULT 'manual';

-- Add auto_apply_email_notifications column
ALTER TABLE public.job_preferences 
ADD COLUMN IF NOT EXISTS auto_apply_email_notifications boolean DEFAULT true;
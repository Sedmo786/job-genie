import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { matches } = await req.json() as { matches: JobMatch[] };

    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        results: [],
        message: 'No matches provided' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's auto-apply preferences
    const { data: preferences, error: prefError } = await supabaseClient
      .from('job_preferences')
      .select('auto_apply_enabled, auto_apply_threshold, auto_apply_daily_limit, auto_apply_schedule, auto_apply_email_notifications')
      .eq('user_id', user.id)
      .single();

    if (prefError || !preferences) {
      console.log('No preferences found, using defaults');
    }

    const autoApplyEnabled = preferences?.auto_apply_enabled ?? false;
    const threshold = preferences?.auto_apply_threshold ?? 75;
    const dailyLimit = preferences?.auto_apply_daily_limit ?? 10;
    const emailNotifications = preferences?.auto_apply_email_notifications ?? true;

    if (!autoApplyEnabled) {
      return new Response(JSON.stringify({ 
        success: true, 
        results: [],
        message: 'Auto-apply is disabled' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check today's auto-apply count
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabaseClient
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'auto_applied')
      .gte('created_at', `${today}T00:00:00.000Z`);

    const remainingLimit = dailyLimit - (todayCount || 0);

    if (remainingLimit <= 0) {
      console.log('Daily auto-apply limit reached');
      return new Response(JSON.stringify({ 
        success: true, 
        results: [],
        message: 'Daily auto-apply limit reached' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get existing applications to avoid duplicates
    const jobIds = matches.map(m => m.job_id);
    const { data: existingApps } = await supabaseClient
      .from('applications')
      .select('job_posting_id')
      .eq('user_id', user.id)
      .in('job_posting_id', jobIds);

    const appliedJobIds = new Set(existingApps?.map(a => a.job_posting_id) || []);

    // Filter matches above threshold and not already applied
    const eligibleMatches = matches
      .filter(m => m.score >= threshold && !appliedJobIds.has(m.job_id))
      .sort((a, b) => b.score - a.score)
      .slice(0, remainingLimit);

    if (eligibleMatches.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        results: [],
        message: 'No eligible jobs for auto-apply' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get job details for eligible matches
    const { data: jobs, error: jobsError } = await supabaseClient
      .from('job_postings')
      .select('*')
      .in('id', eligibleMatches.map(m => m.job_id));

    if (jobsError) {
      throw new Error('Failed to fetch job details');
    }

    const results: AutoApplyResult[] = [];

    for (const match of eligibleMatches) {
      const job = jobs?.find(j => j.id === match.job_id);
      if (!job) continue;

      // Determine if auto-apply is possible
      // For now, we mark jobs with apply_url as manual_required (real automation would require browser automation)
      // Jobs without external apply URL get auto_applied status (simulating internal application)
      const canAutoApply = !job.apply_url || job.apply_url.includes('linkedin.com/jobs/view');
      
      const status = canAutoApply ? 'auto_applied' : 'manual_required';

      // Create application record
      const { error: insertError } = await supabaseClient
        .from('applications')
        .insert({
          user_id: user.id,
          job_posting_id: job.id,
          job_title: job.title,
          company_name: job.company,
          company_logo_url: job.company_logo_url,
          job_url: job.apply_url,
          job_description: job.description,
          location: job.location,
          work_type: job.work_type,
          salary_range: job.salary_min && job.salary_max 
            ? `${job.salary_currency || 'USD'} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
            : null,
          status,
          applied_at: status === 'auto_applied' ? new Date().toISOString() : null,
          match_score: match.score,
          match_reasons: match.reasons,
        });

      if (insertError) {
        console.error('Failed to insert application:', insertError);
        results.push({
          job_id: job.id,
          job_title: job.title,
          company_name: job.company,
          status: 'failed',
          match_score: match.score,
          reason: insertError.message,
        });
      } else {
        results.push({
          job_id: job.id,
          job_title: job.title,
          company_name: job.company,
          status,
          match_score: match.score,
          apply_url: status === 'manual_required' ? job.apply_url : undefined,
        });
      }
    }

    // Update analytics
    const autoAppliedCount = results.filter(r => r.status === 'auto_applied').length;
    const manualRequiredCount = results.filter(r => r.status === 'manual_required').length;

    if (autoAppliedCount > 0 || manualRequiredCount > 0) {
      const { data: existingAnalytics } = await supabaseClient
        .from('job_analytics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existingAnalytics) {
        await supabaseClient
          .from('job_analytics')
          .update({
            jobs_auto_applied: (existingAnalytics.jobs_auto_applied || 0) + autoAppliedCount,
            jobs_manual_required: (existingAnalytics.jobs_manual_required || 0) + manualRequiredCount,
          })
          .eq('id', existingAnalytics.id);
      } else {
        await supabaseClient
          .from('job_analytics')
          .insert({
            user_id: user.id,
            date: today,
            jobs_auto_applied: autoAppliedCount,
            jobs_manual_required: manualRequiredCount,
          });
      }
    }

    console.log(`Auto-apply completed: ${autoAppliedCount} auto-applied, ${manualRequiredCount} manual required`);

    // Send email notification if enabled
    if (emailNotifications && (autoAppliedCount > 0 || manualRequiredCount > 0)) {
      try {
        const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            type: 'daily_summary',
            applications: results.map(r => ({
              job_title: r.job_title,
              company_name: r.company_name,
              status: r.status,
              job_url: r.apply_url,
              match_score: r.match_score,
            })),
          }),
        });
        
        if (emailResponse.ok) {
          console.log('Email notification sent successfully');
        } else {
          console.error('Failed to send email notification:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      summary: {
        auto_applied: autoAppliedCount,
        manual_required: manualRequiredCount,
        failed: results.filter(r => r.status === 'failed').length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-apply:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_description: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_employment_type: string;
  job_is_remote: boolean;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_required_skills: string[] | null;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
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

    const { query, location, page = 1, remote_only = false } = await req.json();

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    // Build search query
    let searchQuery = query || 'software developer';
    if (location) {
      searchQuery += ` in ${location}`;
    }

    const searchParams = new URLSearchParams({
      query: searchQuery,
      page: page.toString(),
      num_pages: '1',
      date_posted: 'week',
    });

    if (remote_only) {
      searchParams.append('remote_jobs_only', 'true');
    }

    console.log('Fetching jobs with query:', searchQuery);

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${searchParams.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('JSearch API error:', response.status, errorText);
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: JSearchJob[] = data.data || [];

    console.log(`Fetched ${jobs.length} jobs from JSearch`);

    // Store jobs in database using service role for insert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const jobsToInsert = jobs.map((job) => ({
      external_id: job.job_id,
      source: 'jsearch',
      title: job.job_title,
      company: job.employer_name,
      company_logo_url: job.employer_logo,
      description: job.job_description?.substring(0, 10000), // Limit description length
      required_skills: job.job_required_skills || [],
      location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
      work_type: job.job_is_remote ? 'remote' : 'onsite',
      salary_min: job.job_min_salary,
      salary_max: job.job_max_salary,
      salary_currency: job.job_salary_currency,
      employment_type: job.job_employment_type,
      apply_url: job.job_apply_link,
      posted_at: job.job_posted_at_datetime_utc,
    }));

    // Upsert jobs to avoid duplicates
    const { error: insertError } = await supabaseAdmin
      .from('job_postings')
      .upsert(jobsToInsert, { 
        onConflict: 'external_id,source',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('Error inserting jobs:', insertError);
    }

    // Update analytics
    await supabaseAdmin
      .from('job_analytics')
      .upsert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        jobs_fetched: jobs.length,
      }, { 
        onConflict: 'user_id,date',
        ignoreDuplicates: false 
      });

    // Fetch stored jobs to return with IDs
    const { data: storedJobs, error: fetchError } = await supabaseClient
      .from('job_postings')
      .select('*')
      .in('external_id', jobs.map(j => j.job_id))
      .order('posted_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching stored jobs:', fetchError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      jobs: storedJobs || [],
      total: jobs.length,
      page,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-jobs:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

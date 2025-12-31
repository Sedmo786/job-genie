import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchResult {
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

    const { jobIds } = await req.json();

    // Fetch user's resume analysis
    const { data: analysis } = await supabaseClient
      .from('resume_analysis')
      .select('*')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch user's job preferences
    const { data: preferences } = await supabaseClient
      .from('job_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch job postings
    const { data: jobs, error: jobsError } = await supabaseClient
      .from('job_postings')
      .select('*')
      .in('id', jobIds);

    if (jobsError || !jobs?.length) {
      throw new Error('No jobs found to match');
    }

    const userSkills = analysis?.skills || [];
    const userExperience = analysis?.experience_years || 0;
    const desiredRoles = preferences?.desired_roles || [];
    const preferredLocations = preferences?.locations || [];
    const minSalary = preferences?.min_salary || 0;
    const maxSalary = preferences?.max_salary || 999999;
    const remotePreference = preferences?.remote_preference || 'any';

    const matches: MatchResult[] = [];

    for (const job of jobs) {
      // Calculate skills match (0-100)
      const jobSkills = (job.required_skills || []).map((s: string) => s.toLowerCase());
      const matchedSkills = userSkills.filter((s: string) => 
        jobSkills.some((js: string) => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js))
      );
      const skillsMatch = jobSkills.length > 0 
        ? Math.min(100, (matchedSkills.length / jobSkills.length) * 100)
        : 50; // Neutral if no skills specified

      // Calculate experience match (0-100)
      let experienceMatch = 50;
      const jobTitle = job.title.toLowerCase();
      if (jobTitle.includes('senior') || jobTitle.includes('lead')) {
        experienceMatch = userExperience >= 5 ? 100 : userExperience >= 3 ? 60 : 30;
      } else if (jobTitle.includes('junior') || jobTitle.includes('entry')) {
        experienceMatch = userExperience <= 2 ? 100 : userExperience <= 4 ? 70 : 40;
      } else {
        experienceMatch = userExperience >= 2 ? 80 : 60;
      }

      // Calculate location match (0-100)
      let locationMatch = 50;
      const jobLocation = (job.location || '').toLowerCase();
      const isRemote = job.work_type === 'remote';
      
      if (remotePreference === 'remote' && isRemote) {
        locationMatch = 100;
      } else if (remotePreference === 'any') {
        locationMatch = 70;
      } else if (preferredLocations.some((loc: string) => jobLocation.includes(loc.toLowerCase()))) {
        locationMatch = 100;
      } else if (isRemote && remotePreference !== 'onsite') {
        locationMatch = 80;
      }

      // Calculate salary match (0-100)
      let salaryMatch = 50;
      if (job.salary_min && job.salary_max) {
        if (job.salary_min >= minSalary && job.salary_max <= maxSalary) {
          salaryMatch = 100;
        } else if (job.salary_max >= minSalary) {
          salaryMatch = 70;
        } else {
          salaryMatch = 30;
        }
      }

      // Calculate role match (0-100)
      let roleMatch = 50;
      if (desiredRoles.length > 0) {
        const titleLower = job.title.toLowerCase();
        if (desiredRoles.some((role: string) => titleLower.includes(role.toLowerCase()))) {
          roleMatch = 100;
        } else if (desiredRoles.some((role: string) => {
          const roleWords = role.toLowerCase().split(' ');
          return roleWords.some(word => titleLower.includes(word));
        })) {
          roleMatch = 70;
        }
      }

      // Calculate overall score (weighted average)
      const score = Math.round(
        skillsMatch * 0.30 +
        experienceMatch * 0.15 +
        locationMatch * 0.20 +
        salaryMatch * 0.15 +
        roleMatch * 0.20
      );

      // Generate explanation
      const explanationParts: string[] = [];
      if (skillsMatch >= 70) explanationParts.push(`Strong skills match (${matchedSkills.length} skills)`);
      if (roleMatch >= 70) explanationParts.push('Matches your desired role');
      if (locationMatch >= 80) explanationParts.push(isRemote ? 'Remote position available' : 'Good location match');
      if (salaryMatch >= 70) explanationParts.push('Salary within your range');
      if (experienceMatch >= 70) explanationParts.push('Experience level aligned');

      matches.push({
        job_id: job.id,
        score,
        reasons: {
          skills_match: Math.round(skillsMatch),
          experience_match: Math.round(experienceMatch),
          location_match: Math.round(locationMatch),
          salary_match: Math.round(salaryMatch),
          role_match: Math.round(roleMatch),
        },
        explanation: explanationParts.length > 0 
          ? explanationParts.join('. ') 
          : 'Potential match based on available data',
      });
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({ 
      success: true, 
      matches,
      user_has_analysis: !!analysis,
      user_has_preferences: !!preferences,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in match-jobs:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

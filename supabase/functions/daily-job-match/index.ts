import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface JobPosting {
  id: string;
  title: string;
  company: string;
  company_logo_url: string | null;
  location: string | null;
  work_type: string | null;
  apply_url: string | null;
  description: string | null;
  required_skills: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  experience_level: string | null;
}

interface JobPreferences {
  user_id: string;
  desired_roles: string[];
  locations: string[];
  remote_preference: string;
  experience_level: string;
  min_salary: number | null;
  max_salary: number | null;
  auto_apply_enabled: boolean;
  auto_apply_threshold: number;
  auto_apply_daily_limit: number;
}

interface ResumeAnalysis {
  skills: string[];
  experience_years: number | null;
  summary: string | null;
}

interface JobMatch {
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

interface UserProfile {
  user_id: string;
  email: string;
  preferences: JobPreferences;
  analysis: ResumeAnalysis | null;
}

// Calculate match score between job and user profile
function calculateMatchScore(job: JobPosting, preferences: JobPreferences, analysis: ResumeAnalysis | null): { score: number; reasons: JobMatch['reasons']; explanation: string } {
  const reasons = {
    skills_match: 0,
    experience_match: 0,
    location_match: 0,
    salary_match: 0,
    role_match: 0,
  };

  // Role match (40%)
  const desiredRoles = preferences.desired_roles || [];
  const jobTitle = job.title.toLowerCase();
  let roleMatchFound = false;
  for (const role of desiredRoles) {
    if (jobTitle.includes(role.toLowerCase()) || role.toLowerCase().includes(jobTitle.split(' ')[0])) {
      roleMatchFound = true;
      break;
    }
  }
  reasons.role_match = roleMatchFound ? 100 : (desiredRoles.length === 0 ? 60 : 20);

  // Skills match (25%)
  if (analysis?.skills && job.required_skills) {
    const userSkills = analysis.skills.map(s => s.toLowerCase());
    const jobSkills = job.required_skills.map(s => s.toLowerCase());
    const matchingSkills = jobSkills.filter(skill => 
      userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    );
    reasons.skills_match = jobSkills.length > 0 
      ? Math.round((matchingSkills.length / jobSkills.length) * 100)
      : 70;
  } else {
    reasons.skills_match = 50;
  }

  // Experience match (15%)
  if (analysis?.experience_years && job.experience_level) {
    const levelRequirements: Record<string, number> = {
      entry: 0,
      mid: 2,
      senior: 5,
      lead: 7,
      executive: 10,
    };
    const requiredYears = levelRequirements[job.experience_level] || 0;
    if (analysis.experience_years >= requiredYears) {
      reasons.experience_match = 100;
    } else if (analysis.experience_years >= requiredYears - 1) {
      reasons.experience_match = 75;
    } else {
      reasons.experience_match = 40;
    }
  } else {
    reasons.experience_match = 60;
  }

  // Location match (10%)
  const preferredLocations = preferences.locations || [];
  const jobLocation = job.location?.toLowerCase() || '';
  const isRemote = job.work_type?.toLowerCase().includes('remote') || jobLocation.includes('remote');
  
  if (preferences.remote_preference === 'remote' && isRemote) {
    reasons.location_match = 100;
  } else if (preferences.remote_preference === 'any') {
    reasons.location_match = 80;
  } else if (preferredLocations.length === 0) {
    reasons.location_match = 70;
  } else {
    const locationMatch = preferredLocations.some(loc => jobLocation.includes(loc.toLowerCase()));
    reasons.location_match = locationMatch ? 100 : 30;
  }

  // Salary match (10%)
  if (preferences.min_salary && job.salary_max) {
    if (job.salary_max >= preferences.min_salary) {
      reasons.salary_match = 100;
    } else if (job.salary_max >= preferences.min_salary * 0.85) {
      reasons.salary_match = 70;
    } else {
      reasons.salary_match = 30;
    }
  } else {
    reasons.salary_match = 60;
  }

  // Calculate weighted score
  const score = Math.round(
    reasons.role_match * 0.40 +
    reasons.skills_match * 0.25 +
    reasons.experience_match * 0.15 +
    reasons.location_match * 0.10 +
    reasons.salary_match * 0.10
  );

  const explanation = `Role: ${reasons.role_match}%, Skills: ${reasons.skills_match}%, Experience: ${reasons.experience_match}%, Location: ${reasons.location_match}%, Salary: ${reasons.salary_match}%`;

  return { score, reasons, explanation };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting daily job matching...');

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with preferences
    const { data: preferencesData, error: prefError } = await supabaseAdmin
      .from('job_preferences')
      .select('*');

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    if (!preferencesData || preferencesData.length === 0) {
      console.log('No users with preferences found');
      return new Response(JSON.stringify({ message: 'No users to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${preferencesData.length} users...`);

    // Get recent job postings (last 24 hours or recent ones)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: jobsData, error: jobsError } = await supabaseAdmin
      .from('job_postings')
      .select('*')
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      throw jobsError;
    }

    const jobs = jobsData || [];
    console.log(`Found ${jobs.length} recent jobs`);

    if (jobs.length === 0) {
      console.log('No recent jobs to match');
      return new Response(JSON.stringify({ message: 'No recent jobs to match' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process each user
    const results = [];

    for (const preferences of preferencesData as JobPreferences[]) {
      try {
        // Get user email from auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(preferences.user_id);
        
        if (authError || !authData?.user?.email) {
          console.log(`Could not get email for user ${preferences.user_id}`);
          continue;
        }

        const userEmail = authData.user.email;

        // Get user's resume analysis
        const { data: analysisData } = await supabaseAdmin
          .from('resume_analysis')
          .select('skills, experience_years, summary')
          .eq('user_id', preferences.user_id)
          .order('analyzed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const analysis = analysisData as ResumeAnalysis | null;

        // Get user's existing applications to filter out
        const { data: existingApps } = await supabaseAdmin
          .from('applications')
          .select('job_posting_id')
          .eq('user_id', preferences.user_id);

        const appliedJobIds = new Set((existingApps || []).map(a => a.job_posting_id));

        // Match jobs for this user
        const matches: JobMatch[] = [];

        for (const job of jobs) {
          // Skip if already applied
          if (appliedJobIds.has(job.id)) continue;

          const { score, reasons, explanation } = calculateMatchScore(job, preferences, analysis);
          
          // Only include jobs with score >= 50
          if (score >= 50) {
            matches.push({
              job,
              score,
              reasons,
              explanation,
            });
          }
        }

        // Sort by score descending
        matches.sort((a, b) => b.score - a.score);

        // Take top 10 matches
        const topMatches = matches.slice(0, 10);

        if (topMatches.length === 0) {
          console.log(`No matches found for user ${preferences.user_id}`);
          continue;
        }

        console.log(`Found ${topMatches.length} matches for user ${preferences.user_id}`);

        // Send email digest
        const baseUrl = Deno.env.get('SITE_URL') || 'https://autoapply.lovable.app';
        
        const highMatches = topMatches.filter(m => m.score >= 75);
        const goodMatches = topMatches.filter(m => m.score >= 50 && m.score < 75);

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px; }
              .content { background: #f8f9fa; padding: 30px; }
              .summary { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
              .summary-stats { display: flex; justify-content: center; gap: 30px; text-align: center; }
              .stat { }
              .stat-number { font-size: 28px; font-weight: bold; color: #10B981; }
              .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
              .section-title { font-size: 16px; font-weight: 600; color: #333; margin: 20px 0 15px; display: flex; align-items: center; gap: 8px; }
              .section-title span { background: #10B981; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
              .job-card { background: white; padding: 18px; border-radius: 10px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border-left: 4px solid #10B981; }
              .job-card.good { border-left-color: #3B82F6; }
              .job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
              .job-title { font-weight: 600; color: #333; font-size: 15px; margin: 0; }
              .job-company { color: #666; font-size: 14px; margin: 4px 0; }
              .job-meta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
              .job-meta span { font-size: 12px; color: #888; }
              .match-score { background: #10B981; color: white; padding: 4px 10px; border-radius: 15px; font-size: 13px; font-weight: 600; white-space: nowrap; }
              .match-score.good { background: #3B82F6; }
              .apply-btn { display: inline-block; color: #10B981; font-size: 13px; text-decoration: none; margin-top: 10px; font-weight: 500; }
              .cta-section { text-align: center; margin-top: 25px; }
              .cta-btn { display: inline-block; background: #10B981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
              .auto-apply-note { background: #F0FDF4; border: 1px solid #BBF7D0; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; }
              .auto-apply-note p { margin: 0; color: #166534; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 Your Daily Job Matches</h1>
                <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div class="content">
                <div class="summary">
                  <div class="summary-stats">
                    <div class="stat">
                      <div class="stat-number">${topMatches.length}</div>
                      <div class="stat-label">New Matches</div>
                    </div>
                    <div class="stat">
                      <div class="stat-number">${highMatches.length}</div>
                      <div class="stat-label">High Match (75%+)</div>
                    </div>
                  </div>
                </div>

                ${highMatches.length > 0 ? `
                  <div class="section-title">🌟 Top Matches <span>${highMatches.length}</span></div>
                  ${highMatches.slice(0, 5).map(match => `
                    <div class="job-card">
                      <div class="job-header">
                        <div>
                          <h3 class="job-title">${match.job.title}</h3>
                          <p class="job-company">${match.job.company}</p>
                        </div>
                        <span class="match-score">${match.score}%</span>
                      </div>
                      <div class="job-meta">
                        ${match.job.location ? `<span>📍 ${match.job.location}</span>` : ''}
                        ${match.job.work_type ? `<span>💼 ${match.job.work_type}</span>` : ''}
                      </div>
                      ${match.job.apply_url ? `<a href="${match.job.apply_url}" class="apply-btn">View Job →</a>` : ''}
                    </div>
                  `).join('')}
                ` : ''}

                ${goodMatches.length > 0 ? `
                  <div class="section-title">💼 Good Matches <span>${goodMatches.length}</span></div>
                  ${goodMatches.slice(0, 5).map(match => `
                    <div class="job-card good">
                      <div class="job-header">
                        <div>
                          <h3 class="job-title">${match.job.title}</h3>
                          <p class="job-company">${match.job.company}</p>
                        </div>
                        <span class="match-score good">${match.score}%</span>
                      </div>
                      <div class="job-meta">
                        ${match.job.location ? `<span>📍 ${match.job.location}</span>` : ''}
                        ${match.job.work_type ? `<span>💼 ${match.job.work_type}</span>` : ''}
                      </div>
                      ${match.job.apply_url ? `<a href="${match.job.apply_url}" class="apply-btn">View Job →</a>` : ''}
                    </div>
                  `).join('')}
                ` : ''}

                ${preferences.auto_apply_enabled ? `
                  <div class="auto-apply-note">
                    <p>🚀 Auto-Apply is enabled! Jobs matching ${preferences.auto_apply_threshold}%+ will be applied automatically.</p>
                  </div>
                ` : `
                  <div class="auto-apply-note" style="background: #FEF3C7; border-color: #FCD34D;">
                    <p style="color: #92400E;">💡 Enable Auto-Apply to automatically apply to high-matching jobs!</p>
                  </div>
                `}

                <div class="cta-section">
                  <a href="${baseUrl}/jobs" class="cta-btn">View All Matches</a>
                </div>
              </div>
              <div class="footer">
                <p>AutoApply - AI-Powered Job Applications</p>
                <p>You're receiving this because you enabled daily job matching.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const { error: emailError } = await resend.emails.send({
          from: 'AutoApply <onboarding@resend.dev>',
          to: [userEmail],
          subject: `🎯 ${topMatches.length} New Job Matches Found - ${highMatches.length} are 75%+ matches!`,
          html: htmlContent,
        });

        if (emailError) {
          console.error(`Error sending email to ${userEmail}:`, emailError);
          results.push({ user_id: preferences.user_id, status: 'email_failed', matches: topMatches.length });
        } else {
          console.log(`Email sent to ${userEmail} with ${topMatches.length} matches`);
          results.push({ user_id: preferences.user_id, status: 'success', matches: topMatches.length });
        }

        // Update analytics
        const today = new Date().toISOString().split('T')[0];
        const { error: analyticsError } = await supabaseAdmin
          .from('job_analytics')
          .upsert({
            user_id: preferences.user_id,
            date: today,
            jobs_fetched: topMatches.length,
          }, {
            onConflict: 'user_id,date',
          });

        if (analyticsError) {
          console.error('Error updating analytics:', analyticsError);
        }

      } catch (userError) {
        console.error(`Error processing user ${preferences.user_id}:`, userError);
        results.push({ user_id: preferences.user_id, status: 'error', error: String(userError) });
      }
    }

    console.log('Daily job matching complete:', results);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily-job-match:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

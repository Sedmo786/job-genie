import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface JobMatch {
  job_title: string;
  company_name: string;
  match_score: number;
  job_url?: string;
  location?: string;
}

interface Application {
  job_title: string;
  company_name: string;
  status: string;
  job_url?: string;
  location?: string;
  match_score?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, applications, matches, statusUpdate, email: directEmail, data, fileName } = body;
    
    let userEmail: string;
    
    // Allow direct email for internal/test calls (e.g., from daily-job-match cron)
    if (directEmail) {
      userEmail = directEmail;
    } else {
      // Authenticated calls from frontend
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

      if (!user.email) {
        throw new Error('User email not found');
      }
      userEmail = user.email;
    }

    const baseUrl = Deno.env.get('SITE_URL') || 'https://autoapply.lovable.app';

    let subject = '';
    let htmlContent = '';

    if (type === 'new_job_matches') {
      const jobMatches = matches as JobMatch[];
      const topMatches = jobMatches.slice(0, 5);
      
      subject = `🎯 ${jobMatches.length} New Job Matches Found!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
            .match-card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #10B981; }
            .match-score { background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; display: inline-block; }
            .job-title { font-weight: bold; color: #333; font-size: 16px; margin-bottom: 5px; }
            .job-company { color: #666; font-size: 14px; }
            .job-location { color: #888; font-size: 13px; margin-top: 5px; }
            .btn { display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .apply-link { color: #10B981; font-size: 14px; text-decoration: none; margin-top: 10px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Job Matches!</h1>
            </div>
            <div class="content">
              <p style="margin-top: 0;">Great news! We found <strong>${jobMatches.length} jobs</strong> that match your profile and preferences.</p>
              
              ${topMatches.map((job: JobMatch) => `
                <div class="match-card">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <div class="job-title">${job.job_title}</div>
                      <div class="job-company">${job.company_name}</div>
                      ${job.location ? `<div class="job-location">📍 ${job.location}</div>` : ''}
                    </div>
                    <span class="match-score">${job.match_score}% Match</span>
                  </div>
                  ${job.job_url ? `<a href="${job.job_url}" class="apply-link">View Job →</a>` : ''}
                </div>
              `).join('')}
              
              ${jobMatches.length > 5 ? `<p style="color: #666; font-size: 14px;">...and ${jobMatches.length - 5} more matches</p>` : ''}
              
              <a href="${baseUrl}/jobs" class="btn">View All Matches</a>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'status_update') {
      const app = statusUpdate as Application;
      const statusEmoji: Record<string, string> = {
        screening: '📋',
        interviewing: '🎤',
        offer: '🎉',
        rejected: '😔',
        withdrawn: '↩️',
      };
      const statusColor: Record<string, string> = {
        screening: '#3B82F6',
        interviewing: '#8B5CF6',
        offer: '#10B981',
        rejected: '#EF4444',
        withdrawn: '#6B7280',
      };
      
      subject = `${statusEmoji[app.status] || '📌'} Application Update: ${app.job_title} at ${app.company_name}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${statusColor[app.status] || '#8B5CF6'}, ${statusColor[app.status] || '#6366F1'}); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
            .status-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
            .status-badge { background: ${statusColor[app.status] || '#8B5CF6'}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 16px; font-weight: bold; display: inline-block; text-transform: capitalize; }
            .btn { display: inline-block; background: ${statusColor[app.status] || '#8B5CF6'}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusEmoji[app.status] || '📌'} Status Update</h1>
            </div>
            <div class="content">
              <div class="status-card">
                <h2 style="margin-top: 0;">${app.job_title}</h2>
                <p style="color: #666; margin-bottom: 20px;">${app.company_name}</p>
                <div class="status-badge">${app.status.replace('_', ' ')}</div>
                ${app.status === 'offer' ? '<p style="margin-top: 20px; color: #10B981; font-weight: bold;">🎉 Congratulations on receiving an offer!</p>' : ''}
                ${app.status === 'interviewing' ? '<p style="margin-top: 20px; color: #8B5CF6;">Good luck with your interview!</p>' : ''}
              </div>
              <a href="${baseUrl}/applications" class="btn">View Application</a>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'daily_summary') {
      const autoApplied = applications.filter((a: Application) => a.status === 'auto_applied');
      const manualRequired = applications.filter((a: Application) => a.status === 'manual_required');

      subject = `AutoApply Daily Summary - ${new Date().toLocaleDateString()}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6, #6366F1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
            .stat-box { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stat-number { font-size: 32px; font-weight: bold; color: #8B5CF6; }
            .job-list { list-style: none; padding: 0; }
            .job-item { background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #8B5CF6; }
            .job-title { font-weight: bold; color: #333; }
            .job-company { color: #666; font-size: 14px; }
            .btn { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .manual-jobs { border-left-color: #F59E0B; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 AutoApply Daily Summary</h1>
            </div>
            <div class="content">
              <div class="stat-box">
                <div class="stat-number">${autoApplied.length}</div>
                <div>Jobs Auto-Applied Today</div>
              </div>
              
              ${autoApplied.length > 0 ? `
                <h3>✅ Successfully Applied</h3>
                <ul class="job-list">
                  ${autoApplied.map((job: Application) => `
                    <li class="job-item">
                      <div class="job-title">${job.job_title}</div>
                      <div class="job-company">${job.company_name}</div>
                    </li>
                  `).join('')}
                </ul>
              ` : ''}
              
              ${manualRequired.length > 0 ? `
                <h3>⚠️ Manual Application Required</h3>
                <ul class="job-list">
                  ${manualRequired.map((job: Application) => `
                    <li class="job-item manual-jobs">
                      <div class="job-title">${job.job_title}</div>
                      <div class="job-company">${job.company_name}</div>
                      ${job.job_url ? `<a href="${job.job_url}" style="color: #8B5CF6; font-size: 14px;">Apply Now →</a>` : ''}
                    </li>
                  `).join('')}
                </ul>
              ` : ''}
              
              <a href="${baseUrl}/dashboard" class="btn">View Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'application_complete') {
      const app = applications[0] as Application;
      subject = `✅ Application Submitted: ${app.job_title} at ${app.company_name}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
            .job-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .btn { display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Application Submitted!</h1>
            </div>
            <div class="content">
              <div class="job-card">
                <h2 style="margin-top: 0;">${app.job_title}</h2>
                <p style="color: #666; margin-bottom: 10px;">${app.company_name}</p>
                ${app.location ? `<p style="color: #888; font-size: 14px;">📍 ${app.location}</p>` : ''}
                ${app.match_score ? `<p style="color: #10B981; font-weight: bold;">Match Score: ${app.match_score}%</p>` : ''}
              </div>
              <a href="${baseUrl}/applications" class="btn">Track Application</a>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'preferences_saved') {
      subject = `⚙️ Your Job Preferences Have Been Updated`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #8B5CF6, #6366F1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
            .info-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
            .feature { padding: 12px; border-left: 3px solid #8B5CF6; margin-bottom: 10px; background: #F8F7FF; }
            .feature-title { font-weight: 600; color: #8B5CF6; }
            .btn { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚙️ Preferences Updated!</h1>
            </div>
            <div class="content">
              <div class="info-card">
                <h3 style="margin-top: 0;">Your job preferences have been saved</h3>
                <p>We'll use these preferences to find the best job matches for you.</p>
                
                <div class="feature">
                  <div class="feature-title">🎯 Daily Job Matching</div>
                  <p style="margin: 5px 0 0; font-size: 14px; color: #666;">You'll receive daily emails with jobs matching your criteria.</p>
                </div>
                
                <div class="feature">
                  <div class="feature-title">🚀 Auto-Apply</div>
                  <p style="margin: 5px 0 0; font-size: 14px; color: #666;">When enabled, we'll automatically apply to high-matching jobs for you.</p>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${baseUrl}/jobs" class="btn">Discover Jobs</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'resume_uploaded') {
      const resumeFileName = fileName || 'your resume';
      subject = `📄 Resume Uploaded Successfully`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
            .success-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
            .icon { font-size: 48px; margin-bottom: 15px; }
            .steps { text-align: left; margin-top: 20px; }
            .step { display: flex; gap: 12px; margin-bottom: 15px; }
            .step-number { background: #10B981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; }
            .step-text { font-size: 14px; color: #666; }
            .btn { display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Resume Uploaded!</h1>
            </div>
            <div class="content">
              <div class="success-card">
                <div class="icon">✅</div>
                <h2 style="margin: 0;">Resume uploaded successfully!</h2>
                <p style="color: #666;">We're now analyzing your resume to find the best job matches.</p>
                
                <div class="steps">
                  <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-text"><strong>Resume Analysis</strong> - We'll extract your skills, experience, and qualifications.</div>
                  </div>
                  <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-text"><strong>Job Matching</strong> - We'll match you with relevant job opportunities.</div>
                  </div>
                  <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-text"><strong>Daily Updates</strong> - Receive daily emails with new job matches.</div>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${baseUrl}/resumes" class="btn">View Resumes</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'test') {
      const message = data?.message || 'This is a test notification';
      subject = `🧪 Test Notification from Job Genie`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; text-align: center; }
            .success-icon { font-size: 64px; margin-bottom: 20px; }
            .message { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Test Notification</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <div class="message">
                <h2>Email Setup Working!</h2>
                <p>${message}</p>
                <p style="color: #666; margin-top: 20px;">If you received this email, your notification system is configured correctly.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    console.log(`Sending ${type} email to ${userEmail}`);

    const { error: emailError } = await resend.emails.send({
      from: 'AutoApply <onboarding@resend.dev>',
      to: [userEmail],
      subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      throw new Error('Failed to send email');
    }

    console.log(`Email sent successfully: ${type}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-notification:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

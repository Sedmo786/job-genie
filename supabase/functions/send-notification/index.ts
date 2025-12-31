import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    const { type, applications } = await req.json();

    if (!user.email) {
      throw new Error('User email not found');
    }

    const baseUrl = Deno.env.get('SITE_URL') || 'https://autoapply.lovable.app';

    let subject = '';
    let htmlContent = '';

    if (type === 'daily_summary') {
      const autoApplied = applications.filter((a: { status: string }) => a.status === 'auto_applied');
      const manualRequired = applications.filter((a: { status: string }) => a.status === 'manual_required');

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
                  ${autoApplied.map((job: { job_title: string; company_name: string }) => `
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
                  ${manualRequired.map((job: { job_title: string; company_name: string; job_url: string }) => `
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
      const app = applications[0];
      subject = `Application Submitted: ${app.job_title} at ${app.company_name}`;
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
    }

    const { error: emailError } = await resend.emails.send({
      from: 'AutoApply <onboarding@resend.dev>',
      to: [user.email],
      subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      throw new Error('Failed to send email');
    }

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

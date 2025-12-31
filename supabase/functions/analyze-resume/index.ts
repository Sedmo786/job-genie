import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { resumeId } = await req.json();

    // Fetch resume details
    const { data: resume, error: resumeError } = await supabaseClient
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (resumeError || !resume) {
      throw new Error('Resume not found');
    }

    // Get signed URL for the resume file
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from('resumes')
      .createSignedUrl(resume.file_path, 60);

    if (signedUrlError || !signedUrlData) {
      throw new Error('Could not access resume file');
    }

    // Fetch the PDF content
    const pdfResponse = await fetch(signedUrlData.signedUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Use Lovable AI to analyze the resume
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Extract structured information from the resume and return it as valid JSON with this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience_years": number,
  "education": [{"degree": "string", "institution": "string", "year": number}],
  "work_history": [{"title": "string", "company": "string", "duration": "string", "responsibilities": ["string"]}],
  "summary": "2-3 sentence professional summary",
  "desired_roles": ["role1", "role2"],
  "preferred_locations": ["location1"],
  "salary_expectation": { "min": number, "max": number, "currency": "USD" }
}
Only return valid JSON, no markdown or explanation.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Parse this resume and extract the structured information. The file is a PDF resume named "${resume.file_name}".`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_resume_data',
              description: 'Extract structured data from a resume',
              parameters: {
                type: 'object',
                properties: {
                  skills: { type: 'array', items: { type: 'string' } },
                  experience_years: { type: 'number' },
                  education: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        degree: { type: 'string' },
                        institution: { type: 'string' },
                        year: { type: 'number' }
                      }
                    }
                  },
                  work_history: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        company: { type: 'string' },
                        duration: { type: 'string' },
                        responsibilities: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  },
                  summary: { type: 'string' },
                  desired_roles: { type: 'array', items: { type: 'string' } },
                  preferred_locations: { type: 'array', items: { type: 'string' } },
                  salary_expectation: {
                    type: 'object',
                    properties: {
                      min: { type: 'number' },
                      max: { type: 'number' },
                      currency: { type: 'string' }
                    }
                  }
                },
                required: ['skills', 'experience_years', 'education', 'work_history', 'summary']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_resume_data' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to analyze resume with AI');
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    let parsedData;
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      parsedData = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    } else if (aiData.choices?.[0]?.message?.content) {
      // Fallback to parsing content directly
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    if (!parsedData) {
      throw new Error('Failed to parse AI response');
    }

    // Upsert resume analysis
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('resume_analysis')
      .upsert({
        user_id: user.id,
        resume_id: resumeId,
        skills: parsedData.skills || [],
        experience_years: parsedData.experience_years || 0,
        education: parsedData.education || [],
        work_history: parsedData.work_history || [],
        summary: parsedData.summary || '',
        analyzed_at: new Date().toISOString(),
      }, { onConflict: 'resume_id' })
      .select()
      .single();

    if (analysisError) {
      console.error('Analysis insert error:', analysisError);
      throw new Error('Failed to save resume analysis');
    }

    // Update job preferences if extracted
    if (parsedData.desired_roles || parsedData.preferred_locations || parsedData.salary_expectation) {
      const preferenceUpdate: Record<string, unknown> = { user_id: user.id };
      
      if (parsedData.desired_roles?.length) {
        preferenceUpdate.desired_roles = parsedData.desired_roles;
      }
      if (parsedData.preferred_locations?.length) {
        preferenceUpdate.locations = parsedData.preferred_locations;
      }
      if (parsedData.salary_expectation) {
        preferenceUpdate.min_salary = parsedData.salary_expectation.min;
        preferenceUpdate.max_salary = parsedData.salary_expectation.max;
        preferenceUpdate.salary_currency = parsedData.salary_expectation.currency || 'USD';
      }

      await supabaseClient
        .from('job_preferences')
        .upsert(preferenceUpdate, { onConflict: 'user_id' });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      extracted: parsedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-resume:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

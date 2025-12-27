import { createSupabaseClient } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@yourdomain.com'
const GUPSHUP_API_KEY = Deno.env.get('GUPSHUP_API_KEY')!
const GUPSHUP_APP_NAME = Deno.env.get('GUPSHUP_APP_NAME')!
const GUPSHUP_SOURCE_NUMBER = Deno.env.get('GUPSHUP_SOURCE_NUMBER')!
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://yourdomain.com'

async function sendEmail(email: string, report: any, brandName: string) {
  const reportData = report.report_data || {}
  const healthScore = reportData.brandHealth?.overallScore || 0

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Neo Intel Weekly Report</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello!</h2>
          <p>Your weekly brand intelligence report for <strong>${brandName}</strong> is ready.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: ${healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444'};">
              ${healthScore}
            </div>
            <div style="color: #6b7280; margin-top: 10px;">Brand Health Score</div>
          </div>
          
          ${reportData.vulnerabilities?.length > 0 ? `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #991b1b; margin-top: 0;">⚠️ ${reportData.vulnerabilities.length} Alert${reportData.vulnerabilities.length > 1 ? 's' : ''}</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${reportData.vulnerabilities.slice(0, 3).map((v: any) => `<li>${v.issue}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${reportData.opportunities?.length > 0 ? `
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #166534; margin-top: 0;">💡 ${reportData.opportunities.length} Opportunity${reportData.opportunities.length > 1 ? 'ies' : ''}</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${reportData.opportunities.slice(0, 3).map((o: any) => `<li>${o.insight}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Report
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated report from Neo Intel. You're receiving this because you opted in to email notifications.
          </p>
        </div>
      </body>
    </html>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: `Your Weekly Brand Report - ${brandName}`,
      html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${error}`)
  }

  return response.json()
}

async function sendWhatsApp(phoneNumber: string, report: any, brandName: string) {
  const reportData = report.report_data || {}
  const healthScore = reportData.brandHealth?.overallScore || 0

  const formattedNumber = phoneNumber.replace(/^\+/, '')

  const alertCount = reportData.vulnerabilities?.length || 0
  const opportunityCount = reportData.opportunities?.length || 0

  const message = `*Neo Intel Weekly Report - ${brandName}*

Brand Health Score: *${healthScore}/100*

${alertCount > 0 ? `⚠️ ${alertCount} Alert${alertCount > 1 ? 's' : ''}\n` : ''}${opportunityCount > 0 ? `💡 ${opportunityCount} Opportunity${opportunityCount > 1 ? 'ies' : ''}\n` : ''}
View full report: ${APP_URL}/dashboard`

  const response = await fetch('https://api.gupshup.io/sm/api/v1/msg', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      apikey: GUPSHUP_API_KEY,
    },
    body: new URLSearchParams({
      channel: 'whatsapp',
      source: GUPSHUP_SOURCE_NUMBER,
      destination: formattedNumber,
      message: message,
      'src.name': GUPSHUP_APP_NAME,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gupshup API error: ${errorText}`)
  }

  return response.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { report_id } = await req.json()
    const supabase = createSupabaseClient()

    // Get report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*, brands!inner(*, profiles!inner(*))')
      .eq('id', report_id)
      .single()

    if (reportError || !report) {
      throw new Error('Report not found')
    }

    const profile = (report.brands as any).profiles
    const brand = report.brands as any

    const tasks = []

    // Send email if opted in
    if (profile.email_opted_in && profile.email) {
      tasks.push(
        sendEmail(profile.email, report, brand.name)
          .then(() => {
            return supabase
              .from('reports')
              .update({ sent_via_email: true })
              .eq('id', report_id)
          })
          .catch((error) => {
            console.error('Error sending email:', error)
          })
      )
    }

    // Send WhatsApp if opted in
    if (profile.whatsapp_opted_in && profile.whatsapp_number) {
      tasks.push(
        sendWhatsApp(profile.whatsapp_number, report, brand.name)
          .then(() => {
            return supabase
              .from('reports')
              .update({ sent_via_whatsapp: true })
              .eq('id', report_id)
          })
          .catch((error) => {
            console.error('Error sending WhatsApp:', error)
          })
      )
    }

    await Promise.allSettled(tasks)

    return new Response(
      JSON.stringify({ message: 'Notifications sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


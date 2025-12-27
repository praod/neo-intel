import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWeeklyReportEmail(email: string, report: any, brandName: string) {
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard" 
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

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Neo Intel <noreply@yourdomain.com>',
      to: email,
      subject: `Your Weekly Brand Report - ${brandName}`,
      html,
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}


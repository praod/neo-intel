const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY!
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME!
const GUPSHUP_SOURCE_NUMBER = process.env.GUPSHUP_SOURCE_NUMBER!

export async function sendWhatsAppMessage(
  phoneNumber: string,
  report: any,
  brandName: string
) {
  const reportData = report.report_data || {}
  const healthScore = reportData.brandHealth?.overallScore || 0

  // Format phone number (remove + if present, ensure it starts with country code)
  const formattedNumber = phoneNumber.replace(/^\+/, '')

  // Create message content
  const alertCount = reportData.vulnerabilities?.length || 0
  const opportunityCount = reportData.opportunities?.length || 0

  const message = `*Neo Intel Weekly Report - ${brandName}*

Brand Health Score: *${healthScore}/100*

${alertCount > 0 ? `⚠️ ${alertCount} Alert${alertCount > 1 ? 's' : ''}\n` : ''}${opportunityCount > 0 ? `💡 ${opportunityCount} Opportunity${opportunityCount > 1 ? 'ies' : ''}\n` : ''}
View full report: ${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard`

  try {
    // Gupshup API endpoint for sending template messages
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

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}


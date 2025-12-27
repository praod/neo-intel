import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email_opted_in, whatsapp_opted_in, whatsapp_number } = body

    const { error } = await supabase
      .from('profiles')
      .update({
        email_opted_in: email_opted_in ?? true,
        whatsapp_opted_in: whatsapp_opted_in ?? false,
        whatsapp_number: whatsapp_opted_in ? whatsapp_number : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notification preferences update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}


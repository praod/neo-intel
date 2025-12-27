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
    const { name, instagram_handle, amazon_product_urls } = body

    const { error } = await supabase
      .from('brands')
      .update({
        name,
        instagram_handle: instagram_handle || null,
        amazon_product_urls: amazon_product_urls || [],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Brand update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update brand' },
      { status: 500 }
    )
  }
}


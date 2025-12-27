import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_id, name, instagram_handle } = body

    // Verify user owns the brand
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brand_id)
      .eq('user_id', user.id)
      .single()

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { error } = await supabase.from('competitors').insert({
      brand_id,
      name,
      instagram_handle,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Competitor creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add competitor' },
      { status: 500 }
    )
  }
}


import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const competitorId = params.id

    // Verify user owns the competitor's brand
    const { data: competitor } = await supabase
      .from('competitors')
      .select('brand_id, brands(user_id)')
      .eq('id', competitorId)
      .single()

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    const brand = competitor.brands as any
    if (!brand || brand.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase.from('competitors').delete().eq('id', competitorId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Competitor deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete competitor' },
      { status: 500 }
    )
  }
}


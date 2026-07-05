import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('stores')
    .select('*, countries(*), store_images(*), users(email, nickname)')
    .eq('id', id)
    .single()

  if (error?.code === 'PGRST116') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '가게를 찾을 수 없어요.' } },
      { status: 404 }
    )
  }

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '가게 정보를 불러오지 못했어요.' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

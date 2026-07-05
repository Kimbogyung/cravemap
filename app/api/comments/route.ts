import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('store_id')
  if (!storeId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'store_id가 필요해요.' } },
      { status: 400 }
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*, users(nickname, email, country_code, countries(flag_emoji, name_i18n))')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '댓글을 불러오지 못했어요.' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요해요.' } },
      { status: 401 }
    )
  }

  const body = await req.json() as { store_id?: string; content?: string }
  const { store_id, content } = body

  if (!store_id) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'store_id가 필요해요.' } },
      { status: 400 }
    )
  }

  if (!content?.trim()) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: '댓글 내용을 입력해주세요.' } },
      { status: 400 }
    )
  }

  if (content.trim().length > 200) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: '댓글은 200자 이하로 입력해주세요.' } },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ store_id, user_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '댓글 작성에 실패했어요.' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}

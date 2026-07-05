import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요해요.' } },
      { status: 401 }
    )
  }

  const { data: comment } = await supabase
    .from('comments')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!comment) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없어요.' } },
      { status: 404 }
    )
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '본인 댓글만 삭제할 수 있어요.' } },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '댓글 삭제에 실패했어요.' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: { deleted_id: id } })
}

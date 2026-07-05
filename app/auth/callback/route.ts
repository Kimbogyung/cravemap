import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = searchParams.get('locale') ?? 'ko'
  const next = searchParams.get('next') ?? `/${locale}`

  if (!code) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=missing_code`)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('nickname, country_code')
      .eq('id', user.id)
      .single()

    if (!profile?.nickname || !profile?.country_code) {
      const redirectParam = next !== `/${locale}` ? `?redirect=${encodeURIComponent(next)}` : ''
      return NextResponse.redirect(`${origin}/${locale}/onboarding${redirectParam}`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}

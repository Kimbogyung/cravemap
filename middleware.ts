import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from './i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
})

// 로그인 필요 라우트
const authRequired = ['/report', '/mypage']
// 로그인 + 프로필 완료 필요 라우트
const profileRequired = ['/report']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth = authRequired.some(r => pathname.includes(r))
  const needsProfile = profileRequired.some(r => pathname.includes(r))

  if (needsAuth) {
    const response = NextResponse.next()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // 로케일 추출 (예: /ko/report → ko)
      const locale = pathname.split('/')[1] || defaultLocale
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // /report: 프로필 완료 여부 추가 확인
    if (needsProfile) {
      const { data: profile } = await supabase
        .from('users')
        .select('nickname, country_code')
        .eq('id', session.user.id)
        .single()

      if (!profile?.nickname || !profile?.country_code) {
        const locale = pathname.split('/')[1] || defaultLocale
        const onboardingUrl = new URL(`/${locale}/onboarding`, request.url)
        onboardingUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(onboardingUrl)
      }
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
}

'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuthStore } from '../store/authStore'

/**
 * 온보딩 완료(nickname + country_code) 여부를 DB 기준으로 확인하는 클라이언트 가드.
 * - profile은 AuthProvider가 DB(public.users)에서 읽어온 값만 사용
 * - DB 값이 아직 로드되지 않았으면 판단하지 않음 (ready=false)
 * - 로드된 DB 값에 nickname 또는 country_code가 NULL이면 /onboarding으로 이동
 *
 * 서버 쪽은 middleware.ts가 같은 기준으로 한 번 더 막는다.
 */
export function useRequireProfile() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const { user, profile, profileLoaded, initialized } = useAuthStore()

  const complete = !!profile?.nickname && !!profile?.country_code
  const ready = initialized && !!user && profileLoaded && complete

  useEffect(() => {
    if (!initialized || !user || !profileLoaded) return
    if (!complete) {
      router.replace(`/${locale}/onboarding?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [initialized, user, profileLoaded, complete, locale, pathname, router])

  return { ready }
}

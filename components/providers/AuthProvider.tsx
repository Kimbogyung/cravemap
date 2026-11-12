'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const locale = useLocale()
  const { setUser, setProfile, resetProfile, setInitialized } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // 닉네임/국가는 항상 DB(public.users)에서 다시 읽어 authStore를 덮어쓴다.
    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('nickname, country_code')
        .eq('id', userId)
        .maybeSingle()
      if (error) {
        // 조회 실패는 "프로필 없음"과 구분: profileLoaded를 false로 두어 온보딩으로 잘못 보내지 않음
        console.error('[CraveMap] Profile load error:', JSON.stringify(error))
        return
      }
      setProfile(data ? { nickname: data.nickname, country_code: data.country_code } : null)
    }

    // 다른 계정으로 바뀌면 이전 계정의 프로필을 먼저 비움
    function applyUser(user: SupabaseUser) {
      const prev = useAuthStore.getState().user
      if (prev?.id !== user.id) resetProfile()
      setUser(user)
    }

    // 초기 세션 확인 (앱을 새로 열 때) → 프로필까지 읽은 뒤 initialized
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        applyUser(user)
        await loadProfile(user.id)
      }
      setInitialized()
    })

    // 인증 상태 변경 구독 (로그인 시 DB 값으로 다시 채움)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          applyUser(session.user)
          loadProfile(session.user.id)
        }
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        const { _signingOut, user: prevUser } = useAuthStore.getState()
        useAuthStore.setState({ user: null, profile: null, profileLoaded: false, _signingOut: false })

        // _signingOut=false이고 이전에 로그인 상태였으면 → 세션 만료
        if (!_signingOut && prevUser !== null) {
          router.replace(`/${locale}/login?expired=1`)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}

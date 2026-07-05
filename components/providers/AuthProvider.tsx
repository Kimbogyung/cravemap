'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const locale = useLocale()
  const { setUser, setProfile, setInitialized } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('users')
        .select('nickname, country_code')
        .eq('id', userId)
        .single()
      setProfile(data ? { nickname: data.nickname, country_code: data.country_code } : null)
    }

    // 초기 세션 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        loadProfile(user.id)
      }
      setInitialized()
    })

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)
          loadProfile(session.user.id)
        }
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        const { _signingOut, user: prevUser } = useAuthStore.getState()
        useAuthStore.setState({ user: null, profile: null, _signingOut: false })

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

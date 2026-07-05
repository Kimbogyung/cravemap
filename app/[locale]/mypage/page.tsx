'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuthStore } from '../../../store/authStore'
import AppLayout from '../../../components/layout/AppLayout'
import TopNav from '../../../components/layout/TopNav'
import Toast from '../../../components/ui/Toast'
import { createClient } from '../../../lib/supabase'

interface CountryInfo {
  flag_emoji: string
  name_i18n: Record<string, string>
}

export default function MypagePage() {
  const t = useTranslations('mypage')
  const locale = useLocale()
  const router = useRouter()
  const { user, profile, initialized, signOut } = useAuthStore()

  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  // 미로그인 → /login 리다이렉트
  useEffect(() => {
    if (initialized && !user) {
      router.replace(`/${locale}/login?redirect=/${locale}/mypage`)
    }
  }, [initialized, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // 국가 정보 조회
  useEffect(() => {
    if (!profile?.country_code) return
    const supabase = createClient()
    supabase
      .from('countries')
      .select('flag_emoji, name_i18n')
      .eq('code', profile.country_code)
      .single()
      .then(({ data }) => { if (data) setCountryInfo(data) })
  }, [profile?.country_code])

  async function handleLogout() {
    setLoggingOut(true)
    await signOut()
    router.replace(`/${locale}/login`)
  }

  if (!initialized || !user) {
    return (
      <AppLayout>
        <TopNav variant="page" title={t('title')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E8342A] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  const nickname = profile?.nickname ?? t('unknown')
  const initial = nickname.charAt(0).toUpperCase()
  const countryName = countryInfo
    ? `${countryInfo.flag_emoji} ${countryInfo.name_i18n[locale] ?? countryInfo.name_i18n['ko'] ?? profile?.country_code}`
    : (profile?.country_code ?? t('unknown'))

  return (
    <AppLayout>
      <TopNav variant="page" title={t('title')} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* 프로필 헤더 */}
        <div className="flex flex-col items-center pt-4 pb-8">
          <div
            className="w-[80px] h-[80px] rounded-full bg-[#E8342A] flex items-center justify-center text-white text-[32px] font-bold mb-4"
            style={{ boxShadow: '0 4px 14px rgba(232,52,42,.3)' }}
          >
            {initial}
          </div>
          <p className="text-[20px] font-bold text-[#1A1A1A]">{nickname}</p>
          <p className="text-[14px] text-[#999] mt-1">{user.email}</p>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-[#F0F0F0] mb-6" />

        {/* 프로필 정보 */}
        <div className="flex flex-col gap-0">
          <ProfileRow label={t('nicknameLabel')} value={nickname} />
          <ProfileRow label={t('countryLabel')} value={countryName} />
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full h-[54px] rounded-full border-2 border-[#E8342A] text-[#E8342A] text-[16px] font-bold mt-10 disabled:border-[#E5E5E5] disabled:text-[#999] transition-colors"
        >
          {t('logoutBtn')}
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AppLayout>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#F0F0F0] last:border-0">
      <span className="text-[14px] text-[#999]">{label}</span>
      <span className="text-[15px] font-semibold text-[#1A1A1A]">{value}</span>
    </div>
  )
}

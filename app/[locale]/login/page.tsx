'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '../../../lib/supabase'
import AppLayout from '../../../components/layout/AppLayout'
import TopNav from '../../../components/layout/TopNav'
import Toast from '../../../components/ui/Toast'

function PinLogo() {
  return (
    <div
      style={{
        width: 72, height: 72,
        background: '#E8342A', borderRadius: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(232,52,42,.35)',
      }}
    >
      <div
        style={{
          width: 26, height: 26,
          background: '#fff',
          borderRadius: '50% 50% 50% 4px',
          transform: 'rotate(-45deg)',
        }}
      />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.9 7.7 23 12 23z" />
      <path fill="#FBBC04" d="M5.7 14.1A7.2 7.2 0 0 1 5.3 12c0-.7.1-1.4.3-2.1V7.1H2.1A11 11 0 0 0 1 12c0 1.8.4 3.5 1.1 5l3.6-2.9z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2C17.5 2.1 14.9 1 12 1 7.7 1 3.9 3.1 2.1 6.3l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
    </svg>
  )
}

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? `/${locale}`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  // 세션 만료로 리다이렉트된 경우 토스트 표시
  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setToast({ message: tAuth('sessionExpired'), type: 'error' })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?locale=${locale}&next=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) throw error
    } catch {
      setToast({ message: t('error.googleUnavailable'), type: 'error' })
      setLoading(false)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setShowResend(false)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setToast({ message: t('error.emailNotVerified'), type: 'error' })
        setShowResend(true)
      } else if (error.status === 429) {
        setToast({ message: t('error.rateLimited'), type: 'error' })
      } else {
        setToast({ message: t('error.invalid'), type: 'error' })
      }
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('nickname, country_code')
        .eq('id', data.user.id)
        .single()

      if (!profile?.nickname || !profile?.country_code) {
        router.replace(`/${locale}/onboarding?redirect=${encodeURIComponent(redirectTo)}`)
        return
      }
    }

    router.replace(redirectTo)
  }

  async function handleResend() {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (!error) {
      setToast({ message: t('resendSuccess'), type: 'success' })
    }
  }

  const inputCls = 'w-full h-[52px] border border-[#E5E5E5] rounded-[14px] px-4 text-[15px] outline-none focus:border-[#E8342A] transition-colors font-[inherit] bg-white'

  return (
    <AppLayout fullWidth>
      <TopNav variant="page" title={t('title')} />

      <div className="flex-1 overflow-y-auto lg:flex lg:overflow-hidden">
        {/* 왼쪽: 브랜딩 패널 (데스크톱 전용) */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center bg-[#E8342A] px-16">
          <div className="flex flex-col items-center text-center max-w-[380px]">
            {/* TopNav PinIcon과 동일한 형태, 흰색 버전 */}
            <div
              style={{
                width: 88, height: 88,
                background: '#fff',
                borderRadius: '50% 50% 50% 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 28px rgba(0,0,0,.18)',
              }}
            >
              <div
                style={{
                  width: 28, height: 28,
                  background: '#E8342A',
                  borderRadius: '50%',
                }}
              />
            </div>
            <p className="font-extrabold text-[32px] text-white mt-6">CraveMap</p>
            <p className="text-white/80 text-[16px] mt-3 leading-relaxed">{t('subtitle')}</p>
          </div>
        </div>

        {/* 오른쪽: 폼 패널 */}
        <div className="flex flex-col px-6 md:px-10 lg:w-1/2 lg:overflow-y-auto lg:px-16">
          <div className="w-full lg:max-w-[400px] lg:mx-auto lg:my-auto">
            {/* 로고 (모바일/태블릿 전용) */}
            <div className="flex flex-col items-center mt-[34px] mb-[30px] lg:hidden">
              <PinLogo />
              <p className="font-extrabold text-[22px] text-[#E8342A] mt-[14px]">CraveMap</p>
              <p className="text-[#999] text-[14px] mt-1">{t('subtitle')}</p>
            </div>

            {/* Google 로그인 */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-[54px] border border-[#E5E5E5] rounded-full flex items-center justify-center gap-[10px] text-[15px] font-semibold text-[#1A1A1A] bg-white disabled:opacity-60 lg:mt-16"
            >
              <GoogleIcon />
              {t('googleBtn')}
            </button>

            {/* 구분선 */}
            <div className="flex items-center gap-3 my-[22px]">
              <div className="flex-1 h-px bg-[#EEE]" />
              <span className="text-[#bbb] text-[13px]">{t('orDivider')}</span>
              <div className="flex-1 h-px bg-[#EEE]" />
            </div>

            {/* 이메일 폼 */}
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-0">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className={`${inputCls} mb-[10px]`}
                autoComplete="email"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className={inputCls}
                autoComplete="current-password"
              />
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-[54px] rounded-full bg-[#E8342A] text-white text-[16px] font-bold mt-4 disabled:bg-[#E5E5E5] disabled:text-[#999] transition-colors"
              >
                {t('submitBtn')}
              </button>
            </form>

            {/* 인증 메일 재발송 */}
            {showResend && (
              <button
                onClick={handleResend}
                className="mt-3 text-[14px] text-[#E8342A] font-semibold text-center w-full"
              >
                {t('resendEmailBtn')}
              </button>
            )}

            {/* 하단 링크 */}
            <div className="flex justify-center gap-[18px] mt-[22px] text-[14px] pb-8">
              <Link href={`/${locale}/signup`} className="text-[#E8342A] font-semibold">
                {t('signupLink')}
              </Link>
              <span className="text-[#DDD]">|</span>
              <Link href={`/${locale}/forgot-password`} className="text-[#888]">
                {t('forgotLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AppLayout>
  )
}

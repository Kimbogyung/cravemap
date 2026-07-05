'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '../../../lib/supabase'
import AppLayout from '../../../components/layout/AppLayout'
import TopNav from '../../../components/layout/TopNav'
import Toast from '../../../components/ui/Toast'

interface Country {
  code: string
  flag_emoji: string
  name_i18n: Record<string, string>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PW_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const locale = useLocale()
  const router = useRouter()

  const [countries, setCountries] = useState<Country[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // 이메일 인증 대기 화면 상태
  const [verifyStep, setVerifyStep] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('countries')
      .select('code, flag_emoji, name_i18n')
      .order('code')
      .then(({ data }) => { if (data) setCountries(data) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  function validate() {
    const errs: Record<string, string> = {}
    if (!EMAIL_RE.test(email)) errs.email = t('error.emailInvalid')
    if (password.length < 8) errs.password = t('error.passwordShort')
    else if (!PW_RE.test(password)) errs.password = t('error.passwordPattern')
    if (password !== confirm) errs.confirm = t('error.passwordMismatch')
    if (!nickname.trim()) errs.nickname = t('error.nicknameRequired')
    if (!countryCode) errs.country = t('error.countryRequired')
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setErrors({ email: t('error.emailDuplicate') })
      } else {
        setToast({ message: t('error.failed'), type: 'error' })
      }
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase
        .from('users')
        .update({ nickname: nickname.trim(), country_code: countryCode })
        .eq('id', data.user.id)
    }

    setLoading(false)
    setVerifyStep(true)
    setCooldown(60)
  }

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (!error) {
      setToast({ message: t('resendSuccess'), type: 'success' })
      setCooldown(60)
    }
  }, [cooldown, email, supabase, t])

  const inputCls = 'w-full h-[52px] border border-[#E5E5E5] rounded-[14px] px-4 text-[15px] outline-none focus:border-[#E8342A] transition-colors font-[inherit] bg-white'
  const labelCls = 'text-[14px] font-semibold mb-2 mt-4 first:mt-0 block'
  const errCls = 'text-[12px] text-[#E8342A] mt-1'

  if (verifyStep) {
    return (
      <AppLayout>
        <TopNav variant="page" title={t('title')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            style={{
              width: 64, height: 64, background: '#E8342A', borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24, boxShadow: '0 8px 20px rgba(232,52,42,.35)',
            }}
          >
            <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold mb-3">{t('verifyTitle')}</h2>
          <p className="text-[#666] text-[15px] leading-relaxed mb-8">{t('verifyMessage')}</p>
          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full h-[52px] rounded-full border-2 border-[#E8342A] text-[#E8342A] font-semibold text-[15px] disabled:border-[#E5E5E5] disabled:text-[#999] transition-colors"
          >
            {cooldown > 0 ? t('resendCooldown', { seconds: cooldown }) : t('resendBtn')}
          </button>
        </div>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <TopNav variant="page" title={t('title')} />

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col">
          <label className={labelCls}>{t('emailLabel')}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className={inputCls}
            autoComplete="email"
          />
          {errors.email && <p className={errCls}>{errors.email}</p>}

          <label className={labelCls}>{t('passwordLabel')}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('passwordPlaceholder')}
            className={inputCls}
            autoComplete="new-password"
          />
          <p className="text-[12px] text-[#aaa] mt-1">{t('passwordHint')}</p>
          {errors.password && <p className={errCls}>{errors.password}</p>}

          <label className={labelCls}>{t('confirmLabel')}</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={t('confirmPlaceholder')}
            className={inputCls}
            autoComplete="new-password"
          />
          {errors.confirm && <p className={errCls}>{errors.confirm}</p>}

          <label className={labelCls}>{t('nicknameLabel')}</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={20}
            placeholder={t('nicknamePlaceholder')}
            className={inputCls}
          />
          {errors.nickname && <p className={errCls}>{errors.nickname}</p>}

          <label className={labelCls}>{t('countryLabel')}</label>
          <div className="relative">
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              className={`${inputCls} appearance-none pr-10 cursor-pointer`}
            >
              <option value="">{t('countryPlaceholder')}</option>
              {countries.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag_emoji} {c.name_i18n[locale] ?? c.name_i18n['ko'] ?? c.code}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
              width="16" height="16" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          {errors.country && <p className={errCls}>{errors.country}</p>}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[54px] rounded-full bg-[#E8342A] text-white text-[16px] font-bold mt-6 disabled:bg-[#E5E5E5] disabled:text-[#999] transition-colors"
          >
            {t('submitBtn')}
          </button>

          {/* 로그인 링크 */}
          <p className="text-center mt-[18px] text-[14px] text-[#888] pb-6">
            {t('loginPrompt')}{' '}
            <Link href={`/${locale}/login`} className="text-[#E8342A] font-semibold">
              {t('loginLink')}
            </Link>
          </p>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AppLayout>
  )
}

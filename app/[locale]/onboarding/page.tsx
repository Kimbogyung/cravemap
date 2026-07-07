'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '../../../lib/supabase'
import AppLayout from '../../../components/layout/AppLayout'
import Toast from '../../../components/ui/Toast'

interface Country {
  code: string
  flag_emoji: string
  name_i18n: Record<string, string>
}

function PinLogo() {
  return (
    <div
      style={{
        width: 64, height: 64, background: '#E8342A', borderRadius: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(232,52,42,.35)',
      }}
    >
      <div
        style={{
          width: 24, height: 24, background: '#fff',
          borderRadius: '50% 50% 50% 4px', transform: 'rotate(-45deg)',
        }}
      />
    </div>
  )
}

export default function OnboardingPage() {
  const t = useTranslations('auth.onboarding')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? `/${locale}`

  const [countries, setCountries] = useState<Country[]>([])
  const [nickname, setNickname] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // 미로그인 상태면 /login으로
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace(`/${locale}/login`)
    })
    // countries 조회
    supabase
      .from('countries')
      .select('code, flag_emoji, name_i18n')
      .order('code')
      .then(({ data }) => { if (data) setCountries(data) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!nickname.trim()) errs.nickname = t('error.nicknameRequired')
    if (!countryCode) errs.country = t('error.countryRequired')
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace(`/${locale}/login`); return }

    const { error } = await supabase
      .from('users')
      .update({ nickname: nickname.trim(), country_code: countryCode })
      .eq('id', user.id)

    if (error) {
      setToast({ message: t('error.failed'), type: 'error' })
      setLoading(false)
      return
    }

    router.replace(redirectTo)
  }

  const inputCls = 'w-full h-[52px] border border-[#E5E5E5] rounded-[14px] px-4 text-[15px] outline-none focus:border-[#E8342A] transition-colors font-[inherit] bg-white'
  const labelCls = 'text-[14px] font-semibold mb-2 mt-4 first:mt-0 block'
  const errCls = 'text-[12px] text-[#E8342A] mt-1'

  const titleLines = t('title').split('\n')
  const subtitleLines = t('subtitle').split('\n')

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col px-7 md:px-10 overflow-y-auto">
        {/* 헤더 영역 */}
        <div className="mt-12">
          <PinLogo />
          <h1 className="text-[27px] font-extrabold leading-[1.35] tracking-[-0.5px] mt-6">
            {titleLines.map((line, i) => (
              <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>
            ))}
          </h1>
          <p className="text-[#888] text-[15px] leading-[1.6] mt-[14px]">
            {subtitleLines.map((line, i) => (
              <span key={i}>{line}{i < subtitleLines.length - 1 && <br />}</span>
            ))}
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex flex-col mt-10">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[56px] rounded-full bg-[#E8342A] text-white text-[16px] font-bold mt-auto mb-[30px] mt-8 disabled:bg-[#E5E5E5] disabled:text-[#999] transition-colors"
          >
            {t('submitBtn')}
          </button>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AppLayout>
  )
}

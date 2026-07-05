'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '../../../lib/supabase'
import AppLayout from '../../../components/layout/AppLayout'
import TopNav from '../../../components/layout/TopNav'
import Toast from '../../../components/ui/Toast'

const PW_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword')
  const locale = useLocale()
  const router = useRouter()

  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setInvalidLink(true)
        }
        // URL에서 code 제거
        window.history.replaceState({}, '', window.location.pathname)
        setReady(true)
      })
    } else {
      // 이미 세션이 있는지 확인 (예: 브라우저 뒤로가기)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) setInvalidLink(true)
        setReady(true)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const errs: Record<string, string> = {}
    if (password.length < 8) errs.password = t('error.passwordShort')
    else if (!PW_RE.test(password)) errs.password = t('error.passwordPattern')
    if (password !== confirm) errs.confirm = t('error.passwordMismatch')
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      setToast({ message: t('error.failed'), type: 'error' })
      return
    }

    // 변경 성공 후 세션 정리
    await supabase.auth.signOut()
    setDone(true)
  }

  const inputCls = 'w-full h-[52px] border border-[#E5E5E5] rounded-[14px] px-4 text-[15px] outline-none focus:border-[#E8342A] transition-colors font-[inherit] bg-white'
  const labelCls = 'text-[14px] font-semibold mb-2 mt-5 first:mt-0 block'
  const errCls = 'text-[12px] text-[#E8342A] mt-1'

  if (!ready) {
    return (
      <AppLayout>
        <TopNav variant="page" title={t('title')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E8342A] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (invalidLink) {
    return (
      <AppLayout>
        <TopNav variant="page" title={t('title')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            style={{
              width: 56, height: 56, background: '#FDE8E7', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <svg width="26" height="26" fill="none" stroke="#E8342A" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[16px] font-semibold text-[#1A1A1A] mb-2">{t('error.invalidLink')}</p>
          <button
            onClick={() => router.replace(`/${locale}/forgot-password`)}
            className="mt-6 w-full h-[52px] rounded-full bg-[#E8342A] text-white text-[15px] font-bold"
          >
            {t('error.invalidLink').includes('再') ? '再申请' : t('submitBtn')}
          </button>
        </div>
      </AppLayout>
    )
  }

  if (done) {
    return (
      <AppLayout>
        <TopNav variant="page" title={t('title')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            style={{
              width: 64, height: 64, background: '#E8342A', borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: '0 8px 20px rgba(232,52,42,.35)',
            }}
          >
            <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold mb-2">{t('successTitle')}</h2>
          <p className="text-[#666] text-[15px] leading-relaxed mb-8">{t('successMessage')}</p>
          <button
            onClick={() => router.replace(`/${locale}/login`)}
            className="w-full h-[54px] rounded-full bg-[#E8342A] text-white text-[16px] font-bold"
          >
            {t('loginBtn')}
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <TopNav variant="page" title={t('title')} />

      <div className="flex-1 px-6 py-6 flex flex-col">
        <p className="text-[#666] text-[15px] leading-[1.6] mb-6">{t('description')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label className={labelCls}>{t('newPasswordLabel')}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('newPasswordPlaceholder')}
            className={inputCls}
            autoComplete="new-password"
          />
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

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full h-[54px] rounded-full bg-[#E8342A] text-white text-[16px] font-bold mt-8 disabled:bg-[#E5E5E5] disabled:text-[#999] transition-colors"
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

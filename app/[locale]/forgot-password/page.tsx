'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '../../../lib/supabase'
import AppLayout from '../../../components/layout/AppLayout'
import TopNav from '../../../components/layout/TopNav'
import Toast from '../../../components/ui/Toast'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const locale = useLocale()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    })

    // 보안상 성공/실패 구분 없이 동일 메시지
    setLoading(false)
    setSent(true)
  }

  const descLines = t('description').split('\n')

  return (
    <AppLayout>
      <TopNav variant="page" title={t('title')} />

      <div className="flex-1 px-6 py-6 flex flex-col">
        <p className="text-[#666] text-[15px] leading-[1.6] mb-7">
          {descLines.map((line, i) => (
            <span key={i}>{line}{i < descLines.length - 1 && <br />}</span>
          ))}
        </p>

        {sent ? (
          <div className="flex flex-col items-center text-center mt-8">
            <div
              style={{
                width: 56, height: 56, background: '#E8342A', borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, boxShadow: '0 8px 20px rgba(232,52,42,.3)',
              }}
            >
              <svg width="26" height="26" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[16px] font-semibold text-[#1A1A1A] leading-relaxed">
              {t('successMessage')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <label className="text-[14px] font-semibold mb-2">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full h-[52px] border border-[#E5E5E5] rounded-[14px] px-4 text-[15px] outline-none focus:border-[#E8342A] transition-colors font-[inherit] bg-white"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full h-[54px] rounded-full bg-[#E8342A] text-white text-[16px] font-bold mt-5 disabled:bg-[#E5E5E5] disabled:text-[#999] transition-colors"
            >
              {t('submitBtn')}
            </button>
          </form>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AppLayout>
  )
}

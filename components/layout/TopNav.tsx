'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '../../store/authStore'
import LanguageSwitcher from './LanguageSwitcher'

function PinIcon() {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        background: '#E8342A',
        borderRadius: '50% 50% 50% 2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%' }}
      />
    </div>
  )
}

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

interface TopNavProps {
  variant?: 'logo' | 'page'
  title?: string
}

export default function TopNav({ variant = 'logo', title }: TopNavProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('common.nav')
  const { user } = useAuthStore()

  if (variant === 'page') {
    return (
      <nav className="h-[54px] flex items-center gap-[10px] px-4 border-b border-[#F0F0F0] flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center text-[#1A1A1A]"
          aria-label="뒤로가기"
        >
          <ChevronLeft />
        </button>
        {title && <span className="text-[18px] font-bold">{title}</span>}
      </nav>
    )
  }

  return (
    <nav className="h-[54px] flex items-center justify-between px-4 flex-shrink-0">
      <Link href={`/${locale}`} className="flex items-center gap-[6px]">
        <PinIcon />
        <span
          className="font-extrabold text-[20px] text-[#E8342A]"
          style={{ letterSpacing: '-0.5px' }}
        >
          CraveMap
        </span>
      </Link>

      <div className="flex gap-2 items-center">
        {/* 언어 전환 */}
        <LanguageSwitcher />
        {user ? (
          <Link
            href={`/${locale}/mypage`}
            className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#1A1A1A]"
            aria-label={t('mypage')}
          >
            <UserIcon />
          </Link>
        ) : (
          <Link
            href={`/${locale}/login`}
            className="h-9 px-4 rounded-full bg-[#E8342A] flex items-center text-white text-[13px] font-semibold"
          >
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  )
}

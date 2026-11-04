'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

const LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'id', label: 'Bahasa Indonesia' },
]

function GlobeIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  )
}

/**
 * 언어 선택 드롭다운 (TopNav, 랜딩페이지 헤더 공용)
 * 현재 경로를 유지한 채 첫 번째 세그먼트(locale)만 교체한다. 예: /ko/about → /en/about
 */
export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭 / ESC로 닫기
  // (fixed 오버레이 방식은 backdrop-blur 헤더 안에서 헤더 영역에 갇히므로 document 리스너 사용)
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function changeLocale(newLocale: string) {
    try { localStorage.setItem('cravemap_locale', newLocale) } catch {}
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/') || `/${newLocale}`)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#1A1A1A]"
        aria-label="언어 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <GlobeIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-[44px] z-50 bg-white rounded-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.13)] overflow-y-auto overscroll-contain max-h-[calc(100dvh-120px)] min-w-[150px] border border-[#F0F0F0]">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => changeLocale(code)}
              className={`w-full px-4 py-[11px] text-left text-[14px] border-b border-[#F5F5F5] last:border-0 ${
                code === locale
                  ? 'text-[#E8342A] font-semibold bg-[#FFF5F5]'
                  : 'text-[#1A1A1A] hover:bg-[#F8F8F8]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

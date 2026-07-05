'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko, enUS, zhCN, vi as viLocale, ja } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { useAuthStore } from '../../store/authStore'
import Toast from '../ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreImage {
  id: string
  image_url: string
  storage_path: string
  order_index: number
}

interface StoreDetail {
  id: string
  name: string
  latitude: number
  longitude: number
  category: 'restaurant' | 'mart'
  address: string | null
  memo: string | null
  is_approved: boolean
  reported_by: string | null
  created_at: string
  countries: {
    code: string
    flag_emoji: string
    name_i18n: Record<string, string>
  } | null
  store_images: StoreImage[]
  users: {
    email: string | null
    nickname: string | null
  } | null
}

interface CommentUser {
  nickname: string | null
  email: string | null
  country_code: string | null
  countries: {
    flag_emoji: string
    name_i18n: Record<string, string>
  } | null
}

interface Comment {
  id: string
  store_id: string
  user_id: string
  content: string
  created_at: string
  users: CommentUser | null
}

interface Props {
  storeId: string
  onClose: () => void
}

const DATE_LOCALES: Record<string, Locale> = {
  ko,
  en: enUS,
  zh: zhCN,
  vi: viLocale,
  ja,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StoreBottomSheet({ storeId, onClose }: Props) {
  const t = useTranslations('storeDetail')
  const tc = useTranslations('community')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const { user } = useAuthStore()

  // Store data
  const [store, setStore] = useState<StoreDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('error')

  // Slide-in animation
  const [visible, setVisible] = useState(false)

  // Drag-to-dismiss
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef<number | null>(null)

  // Trigger enter animation on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  // Fetch store detail whenever storeId changes
  useEffect(() => {
    setLoading(true)
    setFetchError(false)
    setStore(null)
    setDragOffset(0)
    setCommentText('')

    fetch(`/api/stores/${storeId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStore(json.data as StoreDetail)
        else setFetchError(true)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [storeId])

  // Fetch comments — re-runs when storeId changes
  const fetchComments = useCallback(() => {
    setCommentsLoading(true)
    setCommentsError(false)

    fetch(`/api/comments?store_id=${storeId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setComments(json.data as Comment[])
        else setCommentsError(true)
      })
      .catch(() => setCommentsError(true))
      .finally(() => setCommentsLoading(false))
  }, [storeId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showToast(msg: string, type: 'success' | 'error' = 'error') {
    setToastMessage(msg)
    setToastType(type)
  }

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 320)
  }

  function formatDate(dateStr: string) {
    try {
      return format(new Date(dateStr), 'PP', {
        locale: DATE_LOCALES[locale] ?? ko,
      })
    } catch {
      return dateStr
    }
  }

  function getReporterName() {
    if (!store?.users) return '—'
    return store.users.nickname ?? store.users.email?.split('@')[0] ?? '—'
  }

  function getKakaoNavUrl() {
    if (!store) return '#'
    return `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.latitude},${store.longitude}`
  }

  function getCommentAuthor(c: Comment) {
    return c.users?.nickname ?? c.users?.email?.split('@')[0] ?? '—'
  }

  // ── Comment submit ──────────────────────────────────────────────────────────

  async function handleCommentSubmit() {
    if (!commentText.trim() || commentText.length > 200 || commentSubmitting) return

    setCommentSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, content: commentText.trim() }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        showToast(tc('error.submitFailed'))
        return
      }

      setCommentText('')
      fetchComments()
    } catch {
      showToast(tc('error.submitFailed'))
    } finally {
      setCommentSubmitting(false)
    }
  }

  // ── Comment delete ──────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!confirmDeleteId) return
    const idToDelete = confirmDeleteId
    setConfirmDeleteId(null)

    // Optimistic removal
    setComments((prev) => prev.filter((c) => c.id !== idToDelete))

    try {
      const res = await fetch(`/api/comments/${idToDelete}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok || !json.success) {
        showToast(tc('delete.error'))
        fetchComments()
      }
    } catch {
      showToast(tc('delete.error'))
      fetchComments()
    }
  }

  // ── Drag handlers (header area only) ──────────────────────────────────────

  function onTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
    setIsDragging(true)
    setDragOffset(0)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (dragStartY.current === null) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta > 0) setDragOffset(delta)
  }

  function onTouchEnd() {
    setIsDragging(false)
    if (dragOffset > 100) {
      handleClose()
    } else {
      setDragOffset(0)
    }
    dragStartY.current = null
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const sortedImages = store?.store_images
    ?.slice()
    .sort((a, b) => a.order_index - b.order_index) ?? []

  const countryName =
    store?.countries?.name_i18n?.[locale] ??
    store?.countries?.name_i18n?.['ko'] ??
    store?.countries?.code ??
    ''

  const charCount = commentText.length
  const charCountOver = charCount > 200

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Backdrop — tap to close */}
      <div className="fixed inset-0 z-20" onClick={handleClose} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-[20px] shadow-[0_-4px_32px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden"
        style={{
          maxHeight: '80dvh',
          transform: visible ? `translateY(${dragOffset}px)` : 'translateY(100%)',
          transition: isDragging
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* ── Draggable header ── */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-[10px] pb-[6px]">
            <div className="w-9 h-1 bg-[#E0E0E0] rounded-full" />
          </div>

          {/* Tags + Store name */}
          {store && (
            <div className="px-5 pt-2 pb-4">
              <div className="flex items-center gap-[6px] flex-wrap mb-3">
                {store.countries && (
                  <span className="inline-flex items-center gap-1 px-[10px] py-[3px] rounded-full bg-[#F5F5F5] text-[12px] font-medium text-[#444]">
                    {store.countries.flag_emoji} {countryName}
                  </span>
                )}
                <span className="inline-flex items-center px-[10px] py-[3px] rounded-full bg-[#FFF0EF] text-[12px] font-semibold text-[#E8342A]">
                  {t(`category.${store.category}`)}
                </span>
              </div>
              <h2 className="text-[20px] font-bold text-[#1A1A1A] leading-snug">
                {store.name}
              </h2>
            </div>
          )}

          {/* Skeleton header */}
          {loading && (
            <div className="px-5 pt-2 pb-4 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-[22px] w-20 bg-[#F0F0F0] rounded-full" />
                <div className="h-[22px] w-16 bg-[#F0F0F0] rounded-full" />
              </div>
              <div className="h-7 w-44 bg-[#F0F0F0] rounded-md" />
            </div>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto flex-1 no-scrollbar">

          {/* Error */}
          {fetchError && !loading && (
            <div className="px-5 py-10 text-center text-[14px] text-[#888]">
              {t('loadError')}
            </div>
          )}

          {/* Store detail */}
          {store && !loading && (
            <>
              {/* Address */}
              <div className="px-5 pb-4">
                <div className="flex items-start gap-[6px]">
                  <LocationIcon />
                  <p className="text-[13px] text-[#555] leading-relaxed">
                    {store.address ?? t('noAddress')}
                  </p>
                </div>

                {store.memo && (
                  <p className="mt-[6px] ml-[21px] text-[12px] text-[#999] leading-relaxed">
                    {store.memo}
                  </p>
                )}
              </div>

              <Divider />

              {/* Photos */}
              <div className="px-5 py-4">
                <SectionLabel>{t('photos')}</SectionLabel>
                {sortedImages.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {sortedImages.map((img) => (
                      <div
                        key={img.id}
                        className="flex-shrink-0 w-[120px] h-[90px] rounded-[10px] overflow-hidden bg-[#F0F0F0]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <PhotoPlaceholder />
                )}
              </div>

              <Divider />

              {/* Reporter + Direction */}
              <div className="px-5 py-4 flex items-end justify-between gap-3">
                <div className="flex flex-col gap-[6px]">
                  <MetaRow label={t('reporter')} value={getReporterName()} />
                  <MetaRow label={t('reportedAt')} value={formatDate(store.created_at)} />
                </div>

                <a
                  href={getKakaoNavUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-[5px] px-4 py-[9px] rounded-full bg-[#FEE500] text-[13px] font-semibold text-[#1A1A1A] active:opacity-80"
                >
                  <NavIcon />
                  {t('direction')}
                </a>
              </div>

              <Divider />

              {/* ── Comments section ── */}
              <div className="px-5 py-4">
                <SectionLabel>{tc('title')}</SectionLabel>

                {/* Loading spinner */}
                {commentsLoading && (
                  <div className="flex justify-center py-5">
                    <div className="w-5 h-5 border-2 border-[#E0E0E0] border-t-[#E8342A] rounded-full animate-spin" />
                  </div>
                )}

                {/* Error + retry */}
                {commentsError && !commentsLoading && (
                  <div className="text-center py-4">
                    <p className="text-[13px] text-[#888] mb-2">{tc('error.loadFailed')}</p>
                    <button
                      onClick={fetchComments}
                      className="text-[12px] text-[#E8342A] font-medium underline"
                    >
                      {tCommon('button.retry')}
                    </button>
                  </div>
                )}

                {/* Empty */}
                {!commentsLoading && !commentsError && comments.length === 0 && (
                  <p className="text-[13px] text-[#AAA] text-center py-4">
                    {tc('empty')}
                  </p>
                )}

                {/* Comment list */}
                {!commentsLoading && !commentsError && comments.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-[10px]">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-[30px] h-[30px] rounded-full bg-[#F5F5F5] flex items-center justify-center text-[14px] select-none">
                          {comment.users?.countries?.flag_emoji ?? '🌍'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-[3px]">
                            <span className="text-[12px] font-semibold text-[#333] truncate">
                              {getCommentAuthor(comment)}
                            </span>
                            <div className="flex items-center gap-[10px] flex-shrink-0">
                              <span className="text-[11px] text-[#BBB]">
                                {formatDate(comment.created_at)}
                              </span>
                              {user && user.id === comment.user_id && (
                                <button
                                  onClick={() => setConfirmDeleteId(comment.id)}
                                  className="text-[11px] text-[#CCC] active:text-[#E8342A]"
                                >
                                  {tCommon('button.delete')}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-[13px] text-[#444] leading-relaxed break-words">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom padding */}
              <div className="h-2" />
            </>
          )}

          {/* Skeleton body */}
          {loading && (
            <div className="px-5 py-4 animate-pulse">
              <div className="flex items-start gap-2 mb-6">
                <div className="w-4 h-4 bg-[#F0F0F0] rounded-full flex-shrink-0 mt-[2px]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#F0F0F0] rounded w-full" />
                  <div className="h-4 bg-[#F0F0F0] rounded w-2/3" />
                </div>
              </div>
              <Divider />
              <div className="py-4 flex gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[120px] h-[90px] bg-[#F0F0F0] rounded-[10px]" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Comment input (fixed at bottom of sheet) ── */}
        {store && !loading && (
          <div className="flex-shrink-0 border-t border-[#F0F0F0] bg-white">
            {user ? (
              <div className="px-4 py-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={tc('input.placeholder')}
                      rows={1}
                      maxLength={220}
                      className="w-full px-[12px] py-[9px] pr-[56px] text-[13px] text-[#1A1A1A] bg-[#F7F7F7] rounded-[12px] resize-none outline-none leading-relaxed placeholder:text-[#BBB]"
                      style={{ minHeight: '38px', maxHeight: '80px' }}
                      onInput={(e) => {
                        const el = e.currentTarget
                        el.style.height = 'auto'
                        el.style.height = Math.min(el.scrollHeight, 80) + 'px'
                      }}
                    />
                    <span
                      className={`absolute right-3 bottom-[9px] text-[10px] tabular-nums pointer-events-none ${
                        charCountOver ? 'text-[#E8342A]' : 'text-[#CCC]'
                      }`}
                    >
                      {charCount}/200
                    </span>
                  </div>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || charCountOver || commentSubmitting}
                    className="flex-shrink-0 h-[38px] px-4 rounded-[12px] bg-[#E8342A] text-white text-[13px] font-semibold disabled:opacity-40 active:opacity-80 transition-opacity"
                  >
                    {tc('input.submit')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-[11px] flex items-center justify-between gap-3">
                <p className="text-[13px] text-[#888] leading-tight">{tc('loginRequired')}</p>
                <button
                  onClick={() => router.push(`/${locale}/login`)}
                  className="flex-shrink-0 px-4 py-[7px] rounded-full bg-[#1A1A1A] text-white text-[12px] font-semibold active:opacity-70"
                >
                  {tCommon('nav.login')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Delete confirmation overlay (within sheet) ── */}
        {confirmDeleteId && (
          <div className="absolute inset-0 bg-black/40 z-10 flex items-end">
            <div className="w-full bg-white rounded-t-[16px] px-5 pt-5 pb-8">
              <p className="text-[15px] font-medium text-[#1A1A1A] text-center mb-5">
                {tc('delete.confirmMessage')}
              </p>
              <div className="flex flex-col gap-[10px]">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full py-[13px] rounded-[12px] bg-[#E8342A] text-white text-[14px] font-semibold active:opacity-80"
                >
                  {tc('delete.confirmButton')}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full py-[13px] rounded-[12px] bg-[#F5F5F5] text-[#555] text-[14px] font-semibold active:opacity-70"
                >
                  {tCommon('button.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-[6px] bg-[#F5F5F5]" />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold text-[#AAA] uppercase tracking-wide mb-[10px]">
      {children}
    </p>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[#AAA] w-[44px] flex-shrink-0">{label}</span>
      <span className="text-[13px] text-[#444]">{value}</span>
    </div>
  )
}

function PhotoPlaceholder() {
  return (
    <div className="flex items-center justify-center w-full h-[72px] rounded-[10px] bg-[#F5F5F5]">
      <svg width="24" height="24" fill="none" stroke="#CCC" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  )
}

function LocationIcon() {
  return (
    <svg
      className="mt-[1px] flex-shrink-0 text-[#AAA]"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z" />
      <circle cx="12" cy="8" r="2.5" />
    </svg>
  )
}

function NavIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" />
    </svg>
  )
}

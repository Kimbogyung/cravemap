'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/authStore'
import { useStoresStore } from '../../../store/storesStore'
import AppLayout from '../../../components/layout/AppLayout'
import TopNav from '../../../components/layout/TopNav'
import Toast from '../../../components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Country {
  code: string
  flag_emoji: string
  name_i18n: Record<string, string>
}

interface LocationValue {
  lat: number
  lng: number
  address: string | null
}

// ─── Report Page ──────────────────────────────────────────────────────────────

export default function ReportPage() {
  const t = useTranslations('report')
  const tDetail = useTranslations('storeDetail')
  const locale = useLocale()
  const router = useRouter()
  const { user, initialized: authInitialized } = useAuthStore()
  const { addStore } = useStoresStore()

  // Redirect if not logged in (after auth initialized)
  useEffect(() => {
    if (authInitialized && !user) {
      router.replace(`/${locale}/login?redirect=/${locale}/report`)
    }
  }, [authInitialized, user, locale, router])

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [category, setCategory] = useState<'restaurant' | 'mart' | ''>('')
  const [location, setLocation] = useState<LocationValue | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Countries from DB ─────────────────────────────────────────────────────
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('countries')
      .select('code, flag_emoji, name_i18n')
      .then(({ data }) => {
        if (data) setCountries(data as Country[])
      })
  }, [])

  // ── Validation ────────────────────────────────────────────────────────────
  const isValid =
    name.trim().length > 0 &&
    !!countryCode &&
    !!category &&
    !!location &&
    photos.length > 0

  // ── Photo handlers ────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    let errorMsg = ''
    const valid: File[] = []

    for (const file of files) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        errorMsg = t('error.photoFormat')
        continue
      }
      if (file.size > 1024 * 1024) {
        errorMsg = t('error.photoSize')
        continue
      }
      valid.push(file)
    }

    if (errorMsg) setToast({ message: errorMsg, type: 'error' })
    setPhotos((prev) => [...prev, ...valid].slice(0, 3))
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!isValid || submitting || !location || !category) return
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('country_code', countryCode)
      formData.append('category', category)
      formData.append('latitude', String(location.lat))
      formData.append('longitude', String(location.lng))
      if (location.address) formData.append('address', location.address)
      if (memo.trim()) formData.append('memo', memo.trim())
      photos.forEach((photo) => formData.append('images', photo))

      const res = await fetch('/api/stores', { method: 'POST', body: formData })
      const json = await res.json()

      if (res.status === 201 && json.success) {
        // 즉시 마커 반영 (DB 재조회 없이)
        const selectedCountry = countries.find((c) => c.code === countryCode) ?? null
        addStore({
          id: json.data.id,
          name: json.data.name,
          latitude: json.data.latitude,
          longitude: json.data.longitude,
          category: json.data.category,
          country_code: json.data.country_code,
          countries: selectedCountry,
        })
        setToast({ message: t('submitSuccess'), type: 'success' })
        setTimeout(() => router.replace(`/${locale}`), 1200)
        return
      }

      if (res.status === 207) {
        // 부분 성공: 가게는 등록됐지만 사진 저장 실패
        const selectedCountry = countries.find((c) => c.code === countryCode) ?? null
        addStore({
          id: json.data.id,
          name: json.data.name,
          latitude: json.data.latitude,
          longitude: json.data.longitude,
          category: json.data.category,
          country_code: json.data.country_code,
          countries: selectedCountry,
        })
        setToast({ message: json.error.message, type: 'error' })
        setTimeout(() => router.replace(`/${locale}`), 1800)
        return
      }

      setToast({ message: json.error?.message ?? t('error.submitFailed'), type: 'error' })
    } catch {
      setToast({ message: t('error.submitFailed'), type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!authInitialized || !user) return null

  return (
    <AppLayout fullWidth>
      <TopNav variant="page" title={t('title')} />

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-5 md:px-10 py-6 pb-32 lg:max-w-6xl lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">

          {/* 왼쪽: 폼 필드 */}
          <div className="space-y-7">
            {/* 가게 이름 */}
            <Field label={t('field.name')} required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 50))}
                placeholder={t('field.namePlaceholder')}
                className="w-full h-[48px] px-4 rounded-[12px] bg-[#F5F5F5] text-[15px] text-[#1A1A1A] placeholder-[#BBBBBB] outline-none focus:ring-2 focus:ring-[#E8342A]/30"
              />
              <p className="text-right text-[11px] text-[#BBBBBB] mt-1">
                {name.length}/50
              </p>
            </Field>

            {/* 나라 선택 */}
            <Field label={t('field.country')} required>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountryCode(c.code)}
                    className={`flex items-center gap-1 px-[12px] py-[7px] rounded-full text-[13px] font-medium border transition-colors ${
                      countryCode === c.code
                        ? 'bg-[#E8342A] text-white border-[#E8342A]'
                        : 'bg-white text-[#555] border-[#E0E0E0]'
                    }`}
                  >
                    <span>{c.flag_emoji}</span>
                    <span>{c.name_i18n[locale] ?? c.name_i18n['ko'] ?? c.code}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* 카테고리 */}
            <Field label={t('field.category')} required>
              <div className="flex gap-2">
                {(['restaurant', 'mart'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-[10px] rounded-[12px] text-[14px] font-medium border transition-colors ${
                      category === cat
                        ? 'bg-[#E8342A] text-white border-[#E8342A]'
                        : 'bg-white text-[#555] border-[#E0E0E0]'
                    }`}
                  >
                    {cat === 'restaurant' ? '🍜 ' : '🛒 '}
                    {tDetail(`category.${cat}`)}
                  </button>
                ))}
              </div>
            </Field>

            {/* 사진 */}
            <Field label={t('field.photos')} required>
              <div className="flex gap-3 flex-wrap">
                {photos.map((file, i) => (
                  <div
                    key={i}
                    className="relative w-[90px] h-[90px] rounded-[12px] overflow-hidden bg-[#F0F0F0] flex-shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-[5px] right-[5px] w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                    >
                      <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 10 10">
                        <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
                      </svg>
                    </button>
                  </div>
                ))}

                {photos.length < 3 && (
                  <label className="w-[90px] h-[90px] rounded-[12px] border-2 border-dashed border-[#E0E0E0] flex flex-col items-center justify-center cursor-pointer text-[#BBBBBB] flex-shrink-0 hover:border-[#E8342A] hover:text-[#E8342A] transition-colors">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span className="text-[11px] mt-1">{t('photo.upload')}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                  </label>
                )}
              </div>
              <p className="text-[12px] text-[#BBBBBB] mt-2">{t('photo.limit')}</p>
            </Field>

            {/* 메모 */}
            <Field label={t('field.memo')}>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value.slice(0, 200))}
                placeholder={t('field.memoPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-[12px] bg-[#F5F5F5] text-[15px] text-[#1A1A1A] placeholder-[#BBBBBB] outline-none focus:ring-2 focus:ring-[#E8342A]/30 resize-none"
              />
              <p className="text-right text-[11px] text-[#BBBBBB] mt-1">
                {memo.length}/200
              </p>
            </Field>
          </div>

          {/* 오른쪽: 위치 + 미니 지도 */}
          <div className="mt-7 lg:mt-0 lg:sticky lg:top-6">
            <Field label={t('field.location')} required>
              <LocationPicker
                searchPlaceholder={t('field.addressSearch')}
                onLocationChange={setLocation}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Fixed submit button */}
      <div className="flex-shrink-0 px-5 md:px-10 py-4 bg-white border-t border-[#F0F0F0]">
        <div className="lg:max-w-6xl lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-12">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full h-[52px] rounded-[14px] text-[16px] font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-[#E8342A] text-white active:scale-[0.98]"
          >
            {submitting && (
              <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {t('submit')}
          </button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AppLayout>
  )
}

// ─── Field Wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[14px] font-semibold text-[#1A1A1A] mb-2">
        {label}
        {required && <span className="text-[#E8342A] ml-[2px]">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Location Picker ──────────────────────────────────────────────────────────

function LocationPicker({
  searchPlaceholder,
  onLocationChange,
}: {
  searchPlaceholder: string
  onLocationChange: (loc: LocationValue | null) => void
}) {
  const tLoc = useTranslations('report.field')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<KakaoMap | null>(null)
  const pinRef = useRef<KakaoCustomOverlay | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<KakaoPlaceResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)

  const onChangeRef = useRef(onLocationChange)
  useEffect(() => { onChangeRef.current = onLocationChange }, [onLocationChange])

  // ── KakaoMap init (center resolved from geolocation, fallback to 동서대학교) ──

  // 동서대학교 (geolocation 거부/실패 시 폴백 좌표)
  const FALLBACK_CENTER = { lat: 35.1531, lng: 129.0595 }

  const centerRef = useRef<{ lat: number; lng: number } | null>(null)
  const scriptReadyRef = useRef(false)
  const mapCreatedRef = useRef(false)

  const tryCreateMap = useCallback(() => {
    if (mapCreatedRef.current) return
    if (!scriptReadyRef.current || !centerRef.current || !mapContainerRef.current) return
    mapCreatedRef.current = true

    try {
      const map = new window.kakao.maps.Map(mapContainerRef.current, {
        center: new window.kakao.maps.LatLng(centerRef.current.lat, centerRef.current.lng),
        level: 4,
      })
      mapInstanceRef.current = map
      setMapReady(true)

      window.kakao.maps.event.addListener(map, 'click', (e: unknown) => {
        const { latLng } = e as { latLng: KakaoLatLng }
        const lat = latLng.getLat()
        const lng = latLng.getLng()
        setPin(map, latLng)
        reverseGeocode(lng, lat, (addr) => {
          setSelectedAddress(addr)
          onChangeRef.current({ lat, lng, address: addr })
        })
      })
    } catch {
      // map init failed silently
    }
  }, [])

  // 현재 위치 감지 → 실패/거부 시 폴백 좌표 사용
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      centerRef.current = FALLBACK_CENTER
      tryCreateMap()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        centerRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        tryCreateMap()
      },
      () => {
        centerRef.current = FALLBACK_CENTER
        tryCreateMap()
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [tryCreateMap])

  useEffect(() => {
    if (!mapContainerRef.current) return
    const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!KEY) return
    let mounted = true

    function onKakaoReady() {
      if (!mounted) return
      window.kakao.maps.load(() => {
        if (!mounted) return
        scriptReadyRef.current = true
        tryCreateMap()
      })
    }

    if (window.kakao?.maps) {
      onKakaoReady()
      return () => { mounted = false }
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="dapi.kakao.com"]')
    if (existing) {
      if (window.kakao?.maps) onKakaoReady()
      else existing.addEventListener('load', onKakaoReady, { once: true })
      return () => { mounted = false }
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&libraries=services&autoload=false`
    script.addEventListener('load', onKakaoReady, { once: true })
    document.head.appendChild(script)
    return () => { mounted = false }
  }, [tryCreateMap])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function setPin(map: KakaoMap, latlng: KakaoLatLng) {
    pinRef.current?.setMap(null)
    const content = `<div style="width:20px;height:20px;background:#E8342A;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:translate(-50%,-50%);"></div>`
    pinRef.current = new window.kakao.maps.CustomOverlay({
      position: latlng,
      content,
      map,
      zIndex: 2,
    })
  }

  function reverseGeocode(lng: number, lat: number, cb: (addr: string | null) => void) {
    if (!window.kakao?.maps?.services) { cb(null); return }
    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        cb(result[0].address.address_name)
      } else {
        cb(null)
      }
    })
  }

  function handleSearch() {
    const q = searchInput.trim()
    if (!q || !mapReady) return
    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(q, (results, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(results.slice(0, 5))
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    })
  }

  function handleSelectResult(result: KakaoPlaceResult) {
    const lat = parseFloat(result.y)
    const lng = parseFloat(result.x)
    const addr = result.road_address_name || result.address_name
    const latlng = new window.kakao.maps.LatLng(lat, lng)
    const map = mapInstanceRef.current
    if (!map) return
    map.panTo(latlng)
    map.setLevel(3)
    setPin(map, latlng)
    setSelectedAddress(addr)
    setSearchInput(result.place_name)
    setShowResults(false)
    onChangeRef.current({ lat, lng, address: addr })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setShowResults(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={searchPlaceholder}
            className="flex-1 h-[44px] px-4 rounded-[12px] bg-[#F5F5F5] text-[14px] text-[#1A1A1A] placeholder-[#BBBBBB] outline-none"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={!mapReady}
            className="h-[44px] px-4 rounded-[12px] bg-[#E8342A] text-white text-[14px] font-semibold disabled:opacity-40 flex-shrink-0"
          >
            {tLoc('searchBtn')}
          </button>
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-[48px] left-0 right-0 bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.12)] z-10 overflow-hidden border border-[#F0F0F0]">
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectResult(r)}
                className="w-full px-4 py-[10px] text-left hover:bg-[#F5F5F5] border-b border-[#F5F5F5] last:border-0"
              >
                <p className="text-[14px] font-medium text-[#1A1A1A] truncate">{r.place_name}</p>
                <p className="text-[12px] text-[#999] truncate mt-[1px]">
                  {r.road_address_name || r.address_name}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini map */}
      <div className="relative w-full h-[220px] lg:h-[420px] rounded-[12px] overflow-hidden bg-[#F0F0F0]">
        <div ref={mapContainerRef} className="absolute inset-0" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F0F0F0]">
            <div className="w-7 h-7 border-[3px] border-[#E8342A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Selected address */}
      {selectedAddress && (
        <div className="flex items-start gap-[6px] px-1">
          <svg className="mt-[2px] flex-shrink-0 text-[#E8342A]" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z" />
            <circle cx="12" cy="8" r="2.5" />
          </svg>
          <p className="text-[13px] text-[#555] leading-relaxed">{selectedAddress}</p>
        </div>
      )}

      <p className="text-[12px] text-[#BBBBBB] px-1">
        {tLoc('locationHint')}
      </p>
    </div>
  )
}

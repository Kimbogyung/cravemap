'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useStoresStore } from '../../store/storesStore'
import type { StoreMarker } from '../../store/storesStore'
import AppLayout from '../layout/AppLayout'
import TopNav from '../layout/TopNav'
import Toast from '../ui/Toast'
import StoreBottomSheet from './StoreBottomSheet'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_CENTER = { lat: 35.1531, lng: 129.0595 } // 동서대학교
// 카카오맵 레벨: 숫자 작을수록 확대 (1=최대, 14=전국). 3 ≈ 캠퍼스 반경 500m
const DEFAULT_ZOOM = 3
const LS_KEY = 'cravemap_last_position'

const MARKER_COLORS: Record<string, string> = {
  CN: '#DE2910',
  VN: '#FFCD00',
  JP: '#2B4C8C',
  DEFAULT: '#7F8C8D',
}

function getMarkerColor(code: string) {
  return MARKER_COLORS[code] ?? MARKER_COLORS.DEFAULT
}

// ─── Types ───────────────────────────────────────────────────────────────────

type MapStore = StoreMarker

interface CountryChip {
  code: string
  flag_emoji: string
  name_i18n: Record<string, string>
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MapScreen() {
  const tMap = useTranslations('map')
  const tNav = useTranslations('common.nav')
  const locale = useLocale()
  const { user } = useAuthStore()
  const isDesktop = useIsDesktop()

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const myLocMarkerRef = useRef<KakaoCustomOverlay | null>(null)
  const storeMarkersRef = useRef<
    Map<string, { marker: KakaoCustomOverlay; store: MapStore }>
  >(new Map())

  // Global stores state (for instant marker updates after report)
  const { stores, initialized: storesInitialized, setStores } = useStoresStore()

  // UI state
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [storesLoading, setStoresLoading] = useState(!storesInitialized)
  const [allCountries, setAllCountries] = useState<CountryChip[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Filter state (단일 선택, '' = 전체)
  const [selCountry, setSelCountry] = useState('')
  const [selCategory, setSelCategory] = useState('')

  // Selected store (bottom sheet)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  // ── Map init ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainerRef.current) return

    const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!KEY) {
      console.error('[CraveMap] NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았습니다.')
      setMapError(true)
      return
    }

    // mounted 플래그: cleanup 이후 state 업데이트 방지 (React Strict Mode 대응)
    let mounted = true

    function createMapInstance() {
      if (!mounted || !mapContainerRef.current) return
      try {
        let center = DEFAULT_CENTER
        let zoom = DEFAULT_ZOOM
        try {
          const saved = localStorage.getItem(LS_KEY)
          if (saved) {
            const p = JSON.parse(saved) as { lat?: number; lng?: number; zoom?: number }
            if (p.lat && p.lng) center = { lat: p.lat, lng: p.lng }
            if (p.zoom) zoom = p.zoom
          }
        } catch {}

        const kakaoMap = new window.kakao.maps.Map(mapContainerRef.current, {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: zoom,
        })
        mapRef.current = kakaoMap
        if (mounted) setMapReady(true)

        // 지도 이동/줌 변경 시 마지막 위치 저장
        const savePosition = () => {
          try {
            const c = kakaoMap.getCenter()
            localStorage.setItem(
              LS_KEY,
              JSON.stringify({ lat: c.getLat(), lng: c.getLng(), zoom: kakaoMap.getLevel() })
            )
          } catch {}
        }
        window.kakao.maps.event.addListener(kakaoMap, 'dragend', savePosition)
        window.kakao.maps.event.addListener(kakaoMap, 'zoom_changed', savePosition)
      } catch (err) {
        console.error('[CraveMap] 지도 초기화 오류 (앱 키 또는 플랫폼 도메인 설정 확인):', err)
        if (mounted) setMapError(true)
      }
    }

    function onScriptLoad() {
      if (!mounted) return
      window.kakao.maps.load(createMapInstance)
    }

    // 케이스 1: window.kakao.maps 이미 존재 (페이지 재방문, HMR 등)
    if (window.kakao?.maps) {
      window.kakao.maps.load(createMapInstance)
      return () => { mounted = false }
    }

    // 케이스 2: 같은 스크립트가 DOM에 이미 있음 (React Strict Mode 이중 실행)
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="dapi.kakao.com"]'
    )
    if (existing) {
      // 이미 로드 완료된 경우
      if (window.kakao?.maps) {
        window.kakao.maps.load(createMapInstance)
      } else {
        // 아직 로딩 중 → load 이벤트 대기
        existing.addEventListener('load', onScriptLoad, { once: true })
      }
      return () => { mounted = false }
    }

    // 케이스 3: 스크립트 최초 로드
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&libraries=services&autoload=false`
    console.log('[CraveMap] 카카오맵 스크립트 로드 URL:', script.src)
    script.addEventListener('load', onScriptLoad, { once: true })
    script.addEventListener('error', () => {
      console.error('[CraveMap] 카카오맵 스크립트 로드 실패 (네트워크 또는 앱 키 오류)')
      if (mounted) setMapError(true)
    }, { once: true })
    document.head.appendChild(script)

    // cleanup: mounted 플래그만 false로 — onload는 건드리지 않음
    return () => { mounted = false }
  }, [])

  // ── Fetch stores (skip if already loaded via storesStore) ────────────────

  useEffect(() => {
    if (storesInitialized) return
    const supabase = createClient()
    supabase
      .from('stores')
      .select(
        'id, name, latitude, longitude, category, country_code, countries(code, flag_emoji, name_i18n)'
      )
      .eq('is_approved', true)
      .then(({ data, error }) => {
        setStoresLoading(false)
        if (error || !data) {
          setToast({ message: tMap('loadError'), type: 'error' })
          return
        }
        setStores(data as unknown as MapStore[])
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch all countries (항상 전체 나라 칩 표시) ───────────────────────────

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('countries')
      .select('code, flag_emoji, name_i18n')
      .then(({ data }) => {
        if (data) setAllCountries(data as CountryChip[])
      })
  }, [])

  // ── Create/update markers ─────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    // 기존 마커 전부 제거
    storeMarkersRef.current.forEach(({ marker }) => marker.setMap(null))
    storeMarkersRef.current.clear()

    stores.forEach((store) => {
      const color = getMarkerColor(store.countries?.code ?? store.country_code)

      const el = document.createElement('div')
      el.style.cssText = 'cursor:pointer;transform:translate(-50%,-100%);'
      el.innerHTML = `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" style="overflow:visible;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.22));"><path d="M14 2C7.4 2 2 7.4 2 14C2 20 14 35 14 35C14 35 26 20 26 14C26 7.4 20.6 2 14 2Z" fill="${color}" stroke="white" stroke-width="2.5"/><circle cx="14" cy="13" r="5" fill="white"/></svg>`
      el.addEventListener('click', () => {
        mapRef.current?.panTo(
          new window.kakao.maps.LatLng(store.latitude, store.longitude)
        )
        setSelectedStoreId(store.id)
      })

      const marker = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(store.latitude, store.longitude),
        content: el,
        map: mapRef.current!,
        zIndex: 1,
      })

      storeMarkersRef.current.set(store.id, { marker, store })
    })
  }, [mapReady, stores])

  // ── Apply filters ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    storeMarkersRef.current.forEach(({ marker, store }) => {
      const countryCode = store.countries?.code ?? store.country_code
      const countryOk = !selCountry || countryCode === selCountry
      const categoryOk = !selCategory || store.category === selCategory
      marker.setMap(countryOk && categoryOk ? mapRef.current! : null)
    })
  }, [selCountry, selCategory, mapReady])

  // ── Filter handlers ───────────────────────────────────────────────────────

  function selectCountry(code: string) {
    setSelCountry(code)
  }

  function selectCategory(cat: string) {
    setSelCategory(cat)
  }

  // ── Current location ──────────────────────────────────────────────────────

  function handleCurrentLocation() {
    if (!navigator.geolocation || !mapRef.current) return
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        if (!mapRef.current) return
        const latlng = new window.kakao.maps.LatLng(lat, lng)
        mapRef.current.panTo(latlng)
        mapRef.current.setLevel(3) // 카카오맵: 3 = 현재 위치 주변 500m

        myLocMarkerRef.current?.setMap(null)

        const content = `<div style="width:18px;height:18px;background:#4A90E2;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(74,144,226,0.3);transform:translate(-50%,-50%);"></div>`

        myLocMarkerRef.current = new window.kakao.maps.CustomOverlay({
          position: latlng,
          content,
          map: mapRef.current,
          zIndex: 2,
        })
      },
      (err) => {
        console.error('[CraveMap] Geolocation error:', err.code, err.message)
        const msg =
          err.code === 1
            ? tMap('locationPermissionDenied')
            : tMap('locationNotFound')
        setToast({ message: msg, type: 'error' })
      },
      {
        enableHighAccuracy: false, // WiFi/셀 기반 측위 (GPS보다 빠르고 실내에서도 동작)
        timeout: 15000,
        maximumAge: 60000,        // 1분 이내 캐시된 위치 재사용
      }
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout fullWidth>
      <TopNav variant="logo" />

      {/* ── Filter bar: 모바일에서만 지도 위에 고정 배치 ── */}
      {!isDesktop && (
        <div className="flex-shrink-0 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-[6px] px-4 py-[8px] overflow-x-auto no-scrollbar">
            <Chip
              label={tMap('filter.all')}
              active={selCountry === ''}
              onClick={() => setSelCountry('')}
            />
            {allCountries.map((c) => (
              <Chip
                key={c.code}
                label={`${c.flag_emoji} ${c.name_i18n[locale] ?? c.name_i18n['ko'] ?? c.code}`}
                active={selCountry === c.code}
                onClick={() => selectCountry(c.code)}
              />
            ))}
          </div>
          <div className="flex items-center gap-[6px] px-4 pb-[8px] overflow-x-auto no-scrollbar">
            <Chip
              label={tMap('filter.all')}
              active={selCategory === ''}
              onClick={() => setSelCategory('')}
            />
            <Chip
              label={tMap('filter.restaurant')}
              active={selCategory === 'restaurant'}
              onClick={() => selectCategory('restaurant')}
            />
            <Chip
              label={tMap('filter.mart')}
              active={selCategory === 'mart'}
              onClick={() => selectCategory('mart')}
            />
          </div>
        </div>
      )}

      {/* ── Map area ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* ── Filter overlay: 데스크톱에서만 지도 위에 오버레이 ── */}
        {isDesktop && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-[6px]">
            <div className="flex items-center gap-[6px] flex-wrap">
              <Chip
                label={tMap('filter.all')}
                active={selCountry === ''}
                onClick={() => setSelCountry('')}
              />
              {allCountries.map((c) => (
                <Chip
                  key={c.code}
                  label={`${c.flag_emoji} ${c.name_i18n[locale] ?? c.name_i18n['ko'] ?? c.code}`}
                  active={selCountry === c.code}
                  onClick={() => selectCountry(c.code)}
                />
              ))}
            </div>
            <div className="flex items-center gap-[6px]">
              <Chip
                label={tMap('filter.all')}
                active={selCategory === ''}
                onClick={() => setSelCategory('')}
              />
              <Chip
                label={tMap('filter.restaurant')}
                active={selCategory === 'restaurant'}
                onClick={() => selectCategory('restaurant')}
              />
              <Chip
                label={tMap('filter.mart')}
                active={selCategory === 'mart'}
                onClick={() => selectCategory('mart')}
              />
            </div>
          </div>
        )}
        {/* 지도 컨테이너 */}
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* 지도 로드 실패 */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5] z-10 px-8 text-center">
            <p className="text-[15px] text-[#666] leading-relaxed">
              {tMap('mapLoadError')}
            </p>
          </div>
        )}

        {/* 가게 로딩 중 */}
        {storesLoading && !mapError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full px-4 py-[9px] shadow-md flex items-center gap-[8px] text-[13px] text-[#555]">
            <div className="w-[15px] h-[15px] border-[2px] border-[#E8342A] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            {tMap('loading')}
          </div>
        )}

        {/* 등록 가게 없음 */}
        {!storesLoading && !mapError && stores.length === 0 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl px-5 py-3 shadow-md text-[13px] text-[#666] text-center max-w-[270px] leading-relaxed">
            {tMap('empty')}
          </div>
        )}

        {/* ── FABs ── */}
        <div className="absolute right-4 bottom-8 flex flex-col gap-3 items-center z-10">
          {/* 현재 위치 버튼 */}
          <button
            onClick={handleCurrentLocation}
            className="w-11 h-11 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.15)] flex items-center justify-center text-[#444]"
            aria-label="현재 위치"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" />
              <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
            </svg>
          </button>

          {/* 제보 플로팅 버튼 (로그인 시만) */}
          {user && (
            <Link
              href={`/${locale}/report`}
              className="w-14 h-14 rounded-full bg-[#E8342A] shadow-[0_4px_16px_rgba(232,52,42,0.45)] flex items-center justify-center text-white"
              aria-label={tNav('report')}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {selectedStoreId && (
        <StoreBottomSheet
          storeId={selectedStoreId}
          onClose={() => setSelectedStoreId(null)}
          isPanel={isDesktop}
        />
      )}
    </AppLayout>
  )
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 h-8 px-[12px] rounded-full text-[13px] font-medium transition-colors whitespace-nowrap shadow-sm ${
        active
          ? 'bg-[#E8342A] text-white'
          : 'bg-white text-[#555] hover:bg-[#F5F5F5]'
      }`}
    >
      {label}
    </button>
  )
}

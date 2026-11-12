// 가게 제보 중복 판정 유틸 (서버 전용 로직이지만 순수 함수라 어디서든 사용 가능)

/** 중복으로 판정할 반경 (미터) */
export const DUPLICATE_RADIUS_M = 50

const EARTH_RADIUS_M = 6_371_000
const METERS_PER_DEGREE_LAT = 111_320

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

/** 두 좌표 사이 거리 (미터, Haversine 공식) */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * 이름 정규화: 공백·특수문자 제거 + 소문자 변환
 * - 문자(\p{L})·숫자(\p{N})만 남겨서 한글/한자/가나/베트남어 등 다국어 이름도 유지
 * - NFKC로 전각/반각 문자 차이를 통일
 */
export function normalizeStoreName(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
}

/** 이름이 같거나 한쪽이 다른 쪽을 포함하면 "비슷함" */
export function isSimilarName(a: string, b: string): boolean {
  const na = normalizeStoreName(a)
  const nb = normalizeStoreName(b)
  // 정규화 후 빈 문자열이면 includes('')가 항상 true가 되므로 비슷하지 않은 것으로 처리
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

export interface StoreCandidate {
  id: string
  name: string
  latitude: number
  longitude: number
}

/** 반경 50m 이내이면서 이름이 비슷한 첫 번째 가게를 반환 (없으면 null) */
export function findDuplicateStore<T extends StoreCandidate>(
  target: { name: string; latitude: number; longitude: number },
  candidates: T[],
  radiusM: number = DUPLICATE_RADIUS_M
): T | null {
  for (const c of candidates) {
    const d = distanceMeters(target.latitude, target.longitude, c.latitude, c.longitude)
    if (d <= radiusM && isSimilarName(target.name, c.name)) return c
  }
  return null
}

/**
 * DB 조회 범위를 줄이기 위한 위경도 사각 범위 (반경보다 약간 넉넉하게)
 * 실제 판정은 findDuplicateStore의 Haversine 거리로 한다.
 */
export function boundingBox(lat: number, lng: number, radiusM: number = DUPLICATE_RADIUS_M) {
  const margin = radiusM * 1.2
  const dLat = margin / METERS_PER_DEGREE_LAT
  const cosLat = Math.max(Math.cos(toRad(lat)), 0.01)
  const dLng = margin / (METERS_PER_DEGREE_LAT * cosLat)
  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
  }
}

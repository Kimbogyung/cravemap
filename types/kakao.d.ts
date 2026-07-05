// KakaoMap global type declarations (ambient module — no imports/exports)

interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void
  panTo(latlng: KakaoLatLng): void
  setLevel(level: number): void
  getCenter(): KakaoLatLng
  getLevel(): number
}

interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void
  getContent(): HTMLElement
  getPosition(): KakaoLatLng
}

interface KakaoGeocoder {
  coord2Address(
    lng: number,
    lat: number,
    callback: (
      result: Array<{ address: { address_name: string } }>,
      status: string
    ) => void
  ): void
}

interface KakaoPlaceResult {
  place_name: string
  address_name: string
  road_address_name: string
  x: string
  y: string
}

interface Window {
  kakao: {
    maps: {
      load(callback: () => void): void
      Map: new (
        container: HTMLElement,
        options: { center: KakaoLatLng; level: number }
      ) => KakaoMap
      LatLng: new (lat: number, lng: number) => KakaoLatLng
      CustomOverlay: new (options: {
        position: KakaoLatLng
        content: string | HTMLElement
        map?: KakaoMap | null
        zIndex?: number
      }) => KakaoCustomOverlay
      Marker: new (options: {
        position: KakaoLatLng
        map?: KakaoMap | null
      }) => { setMap(map: KakaoMap | null): void }
      event: {
        addListener(
          target: unknown,
          type: string,
          handler: (e?: unknown) => void
        ): void
        removeListener(
          target: unknown,
          type: string,
          handler: (e?: unknown) => void
        ): void
      }
      services: {
        Geocoder: new () => KakaoGeocoder
        Places: new () => {
          keywordSearch(
            keyword: string,
            callback: (result: KakaoPlaceResult[], status: string) => void
          ): void
        }
        Status: { OK: string; ZERO_RESULT: string; ERROR: string }
      }
    }
  }
}

import { create } from 'zustand'

export interface StoreMarker {
  id: string
  name: string
  latitude: number
  longitude: number
  category: 'restaurant' | 'mart'
  country_code: string
  countries: {
    code: string
    flag_emoji: string
    name_i18n: Record<string, string>
    marker_color?: string | null
    marker_dot_color?: string | null
  } | null
}

interface StoresState {
  stores: StoreMarker[]
  initialized: boolean
  setStores: (stores: StoreMarker[]) => void
  addStore: (store: StoreMarker) => void
}

export const useStoresStore = create<StoresState>((set) => ({
  stores: [],
  initialized: false,
  setStores: (stores) => set({ stores, initialized: true }),
  addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),
}))

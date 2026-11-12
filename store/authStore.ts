import { create } from 'zustand'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase'

interface Profile {
  nickname: string | null
  country_code: string | null
}

// 닉네임/국가의 기준은 DB public.users 하나뿐.
// profile은 DB에서 읽었거나 DB 저장이 확인된 값만 넣는다. (persist 하지 않음)
interface AuthState {
  user: SupabaseUser | null
  profile: Profile | null
  /** 현재 user의 profile을 DB에서 읽어왔는지 (false면 아직 판단 불가) */
  profileLoaded: boolean
  initialized: boolean
  _signingOut: boolean
  setUser: (user: SupabaseUser | null) => void
  setProfile: (profile: Profile | null) => void
  resetProfile: () => void
  setInitialized: () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  profileLoaded: false,
  initialized: false,
  _signingOut: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile, profileLoaded: true }),
  resetProfile: () => set({ profile: null, profileLoaded: false }),
  setInitialized: () => set({ initialized: true }),
  signOut: async () => {
    set({ _signingOut: true })
    const supabase = createClient()
    await supabase.auth.signOut()
    // State is cleared by AuthProvider's onAuthStateChange SIGNED_OUT handler
  },
}))

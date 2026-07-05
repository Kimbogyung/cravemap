import { create } from 'zustand'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase'

interface Profile {
  nickname: string | null
  country_code: string | null
}

interface AuthState {
  user: SupabaseUser | null
  profile: Profile | null
  initialized: boolean
  _signingOut: boolean
  setUser: (user: SupabaseUser | null) => void
  setProfile: (profile: Profile | null) => void
  setInitialized: () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  initialized: false,
  _signingOut: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setInitialized: () => set({ initialized: true }),
  signOut: async () => {
    set({ _signingOut: true })
    const supabase = createClient()
    await supabase.auth.signOut()
    // State is cleared by AuthProvider's onAuthStateChange SIGNED_OUT handler
  },
}))

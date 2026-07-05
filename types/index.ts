export type Country = {
    id: string
    code: string
    flag_emoji: string
    name_i18n: Record<string, string>
    marker_color: string | null
    created_at: string
  }
  
  export type User = {
    id: string
    email: string
    nickname: string | null
    country_code: string | null
    provider: string
    is_verified: boolean
    created_at: string
    updated_at: string
  }
  
  export type Store = {
    id: string
    name: string
    country_code: string
    category: 'restaurant' | 'mart'
    latitude: number
    longitude: number
    address: string | null
    memo: string | null
    is_approved: boolean
    reported_by: string
    created_at: string
    updated_at: string
    countries?: Country
    store_images?: StoreImage[]
    users?: Pick<User, 'email' | 'nickname'>
  }
  
  export type StoreImage = {
    id: string
    store_id: string
    image_url: string
    storage_path: string
    order_index: number
    created_at: string
  }
  
  export type Comment = {
    id: string
    store_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    users?: Pick<User, 'nickname' | 'email' | 'country_code'> & {
      countries?: Pick<Country, 'flag_emoji' | 'name_i18n'>
    }
  }
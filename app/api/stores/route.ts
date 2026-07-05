import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const MAX_SIZE = 1 * 1024 * 1024 // 1 MB

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // ① 세션 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요해요.' } },
      { status: 401 }
    )
  }

  // ② 입력값 파싱 및 유효성 검사
  const formData = await req.formData()

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const country_code = formData.get('country_code') as string | null
  const category = formData.get('category') as string | null
  const latRaw = formData.get('latitude') as string | null
  const lngRaw = formData.get('longitude') as string | null
  const address = (formData.get('address') as string | null)?.trim() || null
  const memo = (formData.get('memo') as string | null)?.trim() || null
  const images = formData.getAll('images') as File[]

  if (!name || name.length > 50 || !country_code || !category ||
    !['restaurant', 'mart'].includes(category)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: '입력값을 확인해주세요.' } },
      { status: 400 }
    )
  }

  const latitude = latRaw ? parseFloat(latRaw) : NaN
  const longitude = lngRaw ? parseFloat(lngRaw) : NaN
  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: '입력값을 확인해주세요.' } },
      { status: 400 }
    )
  }

  if (images.length === 0 || images.length > 3) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: '사진 업로드 조건을 확인해주세요.' } },
      { status: 400 }
    )
  }

  for (const img of images) {
    if (!ALLOWED_TYPES.has(img.type) || img.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '사진 업로드 조건을 확인해주세요.' } },
        { status: 400 }
      )
    }
  }

  // ③ 이미지 Storage 업로드
  const storeFolder = crypto.randomUUID()
  const uploadedPaths: string[] = []
  const imageUrls: string[] = []

  for (const img of images) {
    const ext = img.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const imgPath = `${storeFolder}/${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await img.arrayBuffer())

    const contentType = img.type || 'image/jpeg'
    const { error: uploadError } = await supabase.storage
      .from('store-images')
      .upload(imgPath, buffer, { contentType })

    if (uploadError) {
      console.error('[CraveMap] Storage upload error:', JSON.stringify(uploadError))
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('store-images').remove(uploadedPaths)
      }
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '사진 업로드에 실패했어요.',
            detail: uploadError.message,
          },
        },
        { status: 500 }
      )
    }

    uploadedPaths.push(imgPath)
    imageUrls.push(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/store-images/${imgPath}`
    )
  }

  // ④ stores 테이블 INSERT
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({
      name,
      country_code,
      category,
      latitude,
      longitude,
      address,
      memo,
      is_approved: true,
      reported_by: user.id,
    })
    .select()
    .single()

  if (storeError || !store) {
    await supabase.storage.from('store-images').remove(uploadedPaths)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '제보 등록에 실패했어요.' } },
      { status: 500 }
    )
  }

  // ⑤ store_images 테이블 INSERT
  const imagesPayload = uploadedPaths.map((path, i) => ({
    store_id: store.id,
    image_url: imageUrls[i],
    storage_path: path,
    order_index: i,
  }))

  const { error: imagesError } = await supabase
    .from('store_images')
    .insert(imagesPayload)

  if (imagesError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'PARTIAL_SUCCESS', message: '가게는 등록됐지만 사진 저장에 실패했어요.' },
        data: { ...store, store_images: [] },
      },
      { status: 207 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        ...store,
        store_images: imagesPayload,
      },
    },
    { status: 201 }
  )
}

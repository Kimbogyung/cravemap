'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type = 'error', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [message, onClose])

  return (
    <div
      className={`fixed bottom-6 left-4 right-4 z-50 max-w-[398px] mx-auto px-4 py-3 rounded-2xl text-sm font-medium text-center text-white shadow-lg ${
        type === 'success' ? 'bg-[#1A1A1A]' : 'bg-[#E8342A]'
      }`}
    >
      {message}
    </div>
  )
}

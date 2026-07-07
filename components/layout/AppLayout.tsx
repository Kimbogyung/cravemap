import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  fullWidth?: boolean
}

export default function AppLayout({ children, fullWidth = false }: Props) {
  return (
    <div
      className={`flex flex-col h-dvh bg-white relative overflow-hidden w-full max-w-[430px] md:max-w-[600px] mx-auto ${
        fullWidth ? 'lg:max-w-none' : ''
      }`}
    >
      {children}
    </div>
  )
}

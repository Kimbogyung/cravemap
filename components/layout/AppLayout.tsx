import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  fullWidth?: boolean
}

export default function AppLayout({ children, fullWidth = false }: Props) {
  return (
    <div className={`flex flex-col h-dvh bg-white relative overflow-hidden ${fullWidth ? 'w-full' : 'w-full max-w-[430px] md:max-w-[600px] mx-auto'}`}>
      {children}
    </div>
  )
}

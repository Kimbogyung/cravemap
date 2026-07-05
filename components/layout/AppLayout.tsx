import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto bg-white relative overflow-hidden">
      {children}
    </div>
  )
}

"use client";

import dynamic from 'next/dynamic'

const LifeClock = dynamic(() => import('@/components/LifeClock'), { ssr: false })

export default function ClientLifeClock() {
  return <LifeClock />
}
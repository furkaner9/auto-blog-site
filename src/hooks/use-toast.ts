"use client"

import { useState, useCallback } from 'react'

type ToastProps = {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback((props: ToastProps) => {
    const id = Math.random()
    setToasts((prev) => [...prev, { ...props }])

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((_, i) => i !== 0))
    }, props.duration || 3000)
  }, [])

  return { toast, toasts }
}

// Basit versiyon - Shadcn toast component'i ile değiştirebilirsin
// Şimdilik console.log ile çalışsın
export function useToast_Simple() {
  const toast = (props: ToastProps) => {
    console.log('Toast:', props)
    alert(`${props.title}\n${props.description || ''}`)
  }

  return { toast }
}
'use client';

import TEIOSApp from './components/TEIOSApp'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function Home() {
  return (
    <ProtectedRoute>
      <TEIOSApp />
    </ProtectedRoute>
  )
}

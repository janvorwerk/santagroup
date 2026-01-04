'use client'

import { Button } from 'react-aria-components'

export function RefreshButton() {
  return (
    <Button
      onPress={() => window.location.reload()}
      className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Refresh
    </Button>
  )
}


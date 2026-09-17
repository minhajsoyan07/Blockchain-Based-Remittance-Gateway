
'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('App Error:', error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h2 className="text-2xl font-bold">Something went wrong!</h2>
            <p className="text-slate-500">{error.message}</p>
            <button
                onClick={() => reset()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
                Try again
            </button>
        </div>
    )
}

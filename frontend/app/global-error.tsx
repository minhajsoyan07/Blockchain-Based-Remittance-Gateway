
'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
                    <h2 className="text-2xl font-bold">Something went wrong!</h2>
                    <p className="text-slate-500">{error.message}</p>
                    <button
                        onClick={() => reset()}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}

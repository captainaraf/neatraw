'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function ResetConfirmPage() {
    const supabase = createClient()
    const router = useRouter()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [sessionReady, setSessionReady] = useState<boolean | null>(null)

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession()
            setSessionReady(!!data.session)
        }

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSessionReady(!!session)
        })

        checkSession()

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [supabase])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setStatus(null)

        if (!password || password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) {
            setError(updateError.message)
        } else {
            setStatus('Password updated. You can now sign in.')
            setTimeout(() => router.push('/login'), 1200)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-xl">
                <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5 dark:shadow-black/40">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-semibold text-foreground">
                            Set a new password
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Create a new password for your NeatRaw account.
                        </p>
                    </div>

                    {sessionReady === false && (
                        <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                            We couldn't verify your reset session. Please open the reset link again or request a new one.
                        </div>
                    )}

                    {error && (
                        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    )}
                    {status && (
                        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
                            <span className="font-medium">Success:</span> {status}
                        </div>
                    )}

                    <form className="space-y-6 mt-6" onSubmit={handleUpdate}>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                New password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-input rounded-md bg-background shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                                Confirm password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-input rounded-md bg-background shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || sessionReady === false}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update password'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-primary hover:text-primary/80">
                    Back to sign in
                </Link>
            </div>
        </div>
    )
}

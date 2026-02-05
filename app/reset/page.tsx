import Link from 'next/link'
import { requestPasswordReset } from '../auth/actions'
import Header from '@/components/Header'

export default function ResetPage({ searchParams }: { searchParams: { message?: string; error?: string } }) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex items-center justify-center px-6 py-12 min-h-[calc(100vh-64px)]">
                <div className="w-full max-w-xl">
                    <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
                        <div className="space-y-2 text-center">
                            <h2 className="text-2xl font-semibold text-foreground">
                                Reset your password
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Enter your email to receive a reset link.
                            </p>
                        </div>

                        <form className="space-y-6 mt-6">
                            {searchParams?.message && (
                                <div className="p-4 mb-4 text-sm text-primary bg-primary/10 rounded-lg" role="alert">
                                    <span className="font-medium">Note:</span> {searchParams.message}
                                </div>
                            )}
                            {searchParams?.error && (
                                <div className="p-4 mb-4 text-sm text-destructive bg-destructive/10 rounded-lg" role="alert">
                                    <span className="font-medium">Error:</span> {searchParams.error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="input"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                formAction={requestPasswordReset}
                                className="btn btn-primary w-full"
                            >
                                Send reset link
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-primary hover:text-primary/80">
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}


import { login, signup } from '../auth/actions'
import Link from 'next/link'

import { ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react'

export default function LoginPage({ searchParams }: { searchParams?: { message?: string, error?: string } }) {
    const safeParams = searchParams ?? {}

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-muted/50 relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    <div>
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="text-2xl font-bold tracking-tight text-foreground">
                                neat<span className="text-primary">raw</span>
                            </span>
                        </Link>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-semibold text-foreground leading-tight mb-4">
                                Share data,<br />
                                not headaches.
                            </h1>
                            <p className="text-muted-foreground max-w-md">
                                Upload raw spreadsheets and let recipients create their own views—tables, charts, or AI insights.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { icon: Zap, text: "Instant Excel & CSV parsing" },
                                { icon: Shield, text: "Private by default, share selectively" },
                                { icon: BarChart3, text: "Charts and AI-powered insights" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-foreground">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-5 bg-card">
                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                            &ldquo;NeatRaw cut our data hand-off time by 80%. No more &apos;can you reformat this?&apos; requests.&rdquo;
                        </p>
                        <p className="mt-3 text-xs font-medium text-foreground">
                            — Operations Lead, Logistics Team
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                neat<span className="text-primary">raw</span>
                            </span>
                        </Link>
                    </div>

                    <div className="fade-up-1">
                        <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h2>
                        <p className="text-muted-foreground mb-8">
                            Sign in to manage your data packets
                        </p>
                    </div>

                    <form className="space-y-5 fade-up-2">
                        {safeParams?.message && (
                            <div className="p-4 rounded-lg bg-info/10 border border-info/20 text-info text-sm flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-info/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-xs">i</span>
                                </div>
                                <span>{safeParams.message}</span>
                            </div>
                        )}
                        {safeParams?.error && (
                            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-xs">!</span>
                                </div>
                                <span>{safeParams.error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="input-label">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="you@example.com"
                                className="input"
                            />
                        </div>

                        <div>
                            <label htmlFor="full_name" className="input-label">
                                Full name <span className="text-muted-foreground font-normal">(for new accounts)</span>
                            </label>
                            <input
                                id="full_name"
                                name="full_name"
                                type="text"
                                placeholder="John Doe"
                                className="input"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="input-label">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="••••••••"
                                className="input"
                            />
                            <div className="mt-2 text-right">
                                <Link href="/reset" className="text-xs text-primary hover:text-primary/80 font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                type="submit"
                                formAction={login}
                                className="btn btn-primary w-full"
                            >
                                Sign in
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                                type="submit"
                                formAction={signup}
                                className="btn btn-secondary w-full"
                            >
                                Create new account
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-xs text-muted-foreground fade-up-3">
                        By signing in, you agree to our{' '}
                        <a href="#" className="text-primary hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

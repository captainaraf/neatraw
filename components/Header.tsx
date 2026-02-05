'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import { ArrowLeft, Plus, ChevronRight, LogOut, User } from 'lucide-react'

interface HeaderProps {
    user?: any
}

export default function Header({ user }: HeaderProps) {
    const pathname = usePathname()
    const isDashboard = pathname.startsWith('/dashboard')
    const isCreate = pathname.startsWith('/create')
    const isData = pathname.startsWith('/data/')
    const isShare = pathname.startsWith('/share/')
    const isLanding = pathname === '/'

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-border">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {(isCreate || isData || isShare) ? (
                        <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">Back</span>
                        </Link>
                    ) : (
                        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                neat<span className="text-primary">raw</span>
                            </span>
                        </Link>
                    )}

                    {(isDashboard || isCreate || isData || isShare) && (
                        <>
                            <div className="h-6 w-px bg-border hidden sm:block" />
                            <span className="text-sm text-muted-foreground hidden sm:inline">
                                {isCreate ? 'Create Data Packet' : isData ? 'Data View' : isShare ? 'Shared View' : 'Dashboard'}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-foreground font-medium hidden sm:inline">{user.email}</span>
                            </div>
                            <form>
                                <button
                                    formAction={signout}
                                    className="btn btn-ghost btn-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="btn btn-ghost text-sm"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/login"
                                className="btn btn-primary text-sm shadow-sm"
                            >
                                Get Started
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

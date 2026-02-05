
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, FileSpreadsheet, Users, Globe, Lock, Calendar, Rows3, ChevronRight } from 'lucide-react'
import DashboardCardActions from '@/components/DashboardCardActions'
import Header from '@/components/Header'

export default async function Dashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: dataPackets } = await supabase
        .from('data_packets')
        .select('*, data_rows(count)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

    const { data: sharedRows } = await supabase
        .from('data_packet_shares')
        .select('packet_id, data_packets ( id, context_text, created_at, is_public )')
        .eq('share_type', 'invite')
        .eq('invited_email', user.email?.toLowerCase() || '')
        .order('created_at', { ascending: false })

    type SharedPacket = {
        id: string
        context_text: string | null
        created_at: string
        is_public: boolean
    }

    const sharedPackets: SharedPacket[] = (sharedRows || [])
        .map((row) => row.data_packets as unknown as SharedPacket)
        .filter((packet): packet is SharedPacket => packet !== null && packet !== undefined)

    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'

    return (
        <div className="min-h-screen bg-background">
            <Header user={user} />

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 fade-up-1">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground mb-1">
                            Welcome back, {userName}!
                        </h1>
                        <p className="text-muted-foreground">
                            Create, share, and explore your data packets
                        </p>
                    </div>
                    <Link
                        href="/create"
                        className="btn btn-primary shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        New Data Packet
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Your Packets Section */}
                <section className="mb-12 fade-up-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Your Data Packets</h2>
                                <p className="text-sm text-muted-foreground">{dataPackets?.length || 0} packets created</p>
                            </div>
                        </div>
                    </div>

                    {dataPackets && dataPackets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dataPackets.map((packet) => {
                                const rowCount = packet.data_rows?.[0]?.count || 0
                                return (
                                    <Link key={packet.id} href={`/data/${packet.id}`} className="group">
                                        <div className="card card-hover p-5 h-full flex flex-col">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileSpreadsheet className="h-5 w-5" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {packet.is_public ? (
                                                        <span className="badge badge-success">
                                                            <Globe className="h-3 w-3" />
                                                            Public
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-muted">
                                                            <Lock className="h-3 w-3" />
                                                            Private
                                                        </span>
                                                    )}
                                                    <DashboardCardActions
                                                        packetId={packet.id}
                                                        initialName={packet.context_text || ''}
                                                    />
                                                </div>
                                            </div>
                                            <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                                                {packet.context_text || 'Untitled Data Packet'}
                                            </h3>
                                            <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(packet.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Rows3 className="h-3.5 w-3.5" />
                                                    {rowCount} rows
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="card p-12 text-center">
                            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No data packets yet</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                                Create your first data packet to start sharing structured data with ease.
                            </p>
                            <Link href="/create" className="btn btn-primary inline-flex">
                                <Plus className="h-4 w-4" />
                                Create Your First Packet
                            </Link>
                        </div>
                    )}
                </section>

                {/* Shared With You Section */}
                <section className="fade-up-3">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Shared With You</h2>
                                <p className="text-sm text-muted-foreground">{sharedPackets.length} packets shared</p>
                            </div>
                        </div>
                    </div>

                    {sharedPackets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sharedPackets.map((packet) => (
                                <Link key={packet.id} href={`/data/${packet.id}`} className="group">
                                    <div className="card card-hover p-5 h-full flex flex-col">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <span className="badge bg-info/10 text-info">
                                                Shared
                                            </span>
                                        </div>
                                        <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-info transition-colors">
                                            {packet.context_text || 'Untitled Data Packet'}
                                        </h3>
                                        <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Shared {new Date(packet.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="card p-8 text-center bg-muted/30 border-dashed">
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                                <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No packets have been shared with you yet.
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

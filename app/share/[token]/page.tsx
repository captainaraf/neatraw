import { createAdminClient } from "@/utils/supabase/admin"
import DataView from "@/components/DataView"
import Link from "next/link"
import Header from "@/components/Header"
import { ArrowLeft, Clock, AlertTriangle, Link2Off } from "lucide-react"

export default async function SharePage({ params }: { params: { token: string } }) {
  const resolvedParams = await params
  const supabase = createAdminClient()

  // Fetch the share + related packet
  const { data: share, error } = await supabase
    .from("data_packet_shares")
    .select("*, data_packets(*)")
    .eq("token", resolvedParams.token)
    .maybeSingle()

  if (error || !share || !share.data_packets) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
          <div className="card p-12 max-w-md w-full text-center fade-up-1">
            <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <Link2Off className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Link Not Found</h1>
            <p className="text-muted-foreground mb-8">
              This share link doesn&apos;t exist or has been deleted.
            </p>
            <Link href="/" className="btn btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
          <div className="card p-12 max-w-md w-full text-center fade-up-1">
            <div className="h-20 w-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Link Expired</h1>
            <p className="text-muted-foreground mb-3">
              This share link is no longer active.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Expired on {new Date(share.expires_at).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <Link href="/" className="btn btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const packet = share.data_packets

  // Fetch rows for this packet
  const { data: rows } = await supabase
    .from("data_rows")
    .select("*")
    .eq("packet_id", packet.id)
    .order("id", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Share Info Banner */}
      <div className="border-b border-border bg-primary/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <span>
              You&apos;re viewing a shared data packet.{" "}
              {share.expires_at && (
                <span>
                  Link expires {new Date(share.expires_at).toLocaleDateString()}.
                </span>
              )}
            </span>
          </div>
          <Link href="/" className="text-primary font-medium hover:underline whitespace-nowrap">
            Create your own →
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 fade-up-1">
        <DataView dataPacket={packet} rows={rows || []} isOwner={false} />
      </main>
    </div>
  )
}

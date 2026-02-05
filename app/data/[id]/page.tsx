import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import DataView from "@/components/DataView"
import Header from "@/components/Header"

export default async function DataPage({ params }: { params: { id: string } }) {
    const resolvedParams = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: packet, error } = await supabase
        .from("data_packets")
        .select("*")
        .eq("id", resolvedParams.id)
        .maybeSingle()

    if (error || !packet) {
        redirect("/dashboard")
    }

    const isOwner = user?.id === packet.owner_id

    // Check if user has access
    if (!isOwner && !packet.is_public) {
        // Check if invited
        if (user?.email) {
            const { data: invite } = await supabase
                .from('data_packet_shares')
                .select('*')
                .eq('packet_id', resolvedParams.id)
                .eq('share_type', 'invite')
                .eq('invited_email', user.email.toLowerCase())
                .maybeSingle()

            if (!invite) {
                redirect("/dashboard")
            }
        } else {
            redirect("/dashboard")
        }
    }

    const { data: rows } = await supabase
        .from("data_rows")
        .select("*")
        .eq("packet_id", resolvedParams.id)
        .order("id", { ascending: true })

    return (
        <div className="min-h-screen bg-background">
            <Header user={user} />

            <main className="max-w-7xl mx-auto px-6 py-8 fade-up-1">
                <DataView dataPacket={packet} rows={rows || []} isOwner={isOwner} />
            </main>
        </div>
    )
}

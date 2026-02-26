"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deletePacket(packetId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const { data: packet } = await supabase
        .from("data_packets")
        .select("owner_id")
        .eq("id", packetId)
        .single();

    if (!packet || packet.owner_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase.from("data_packets").delete().eq("id", packetId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}

export async function updatePacket(packetId: string, updates: { context_text?: string; is_public?: boolean }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const { data: packet } = await supabase
        .from("data_packets")
        .select("owner_id")
        .eq("id", packetId)
        .maybeSingle();

    if (!packet || packet.owner_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("data_packets")
        .update(updates)
        .eq("id", packetId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");
    revalidatePath(`/data/${packetId}`);
    return { success: true };
}

export async function updateRow(packetId: string, rowId: string, rowData: unknown) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const { data: packet } = await supabase
        .from("data_packets")
        .select("owner_id")
        .eq("id", packetId)
        .maybeSingle();

    if (!packet || packet.owner_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("data_rows")
        .update({ row_data: rowData })
        .eq("id", rowId)
        .eq("packet_id", packetId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/data/${packetId}`);
    return { success: true };
}

export async function addRow(packetId: string, rowData: unknown) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const { data: packet } = await supabase
        .from("data_packets")
        .select("owner_id")
        .eq("id", packetId)
        .maybeSingle();

    if (!packet || packet.owner_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("data_rows")
        .insert({ packet_id: packetId, row_data: rowData });

    if (error) return { success: false, error: error.message };

    revalidatePath(`/data/${packetId}`);
    return { success: true };
}

export async function deleteRow(packetId: string, rowId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const { data: packet } = await supabase
        .from("data_packets")
        .select("owner_id")
        .eq("id", packetId)
        .maybeSingle();

    if (!packet || packet.owner_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("data_rows")
        .delete()
        .eq("id", rowId)
        .eq("packet_id", packetId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/data/${packetId}`);
    return { success: true };
}
